package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.exception.ArchivedDeckModificationException;
import com.angelica.recallpathbackend.deck.exception.DeckNotFoundException;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import com.angelica.recallpathbackend.document.entity.Document;
import com.angelica.recallpathbackend.document.entity.DocumentPage;
import com.angelica.recallpathbackend.document.entity.DocumentStatus;
import com.angelica.recallpathbackend.document.exception.DocumentNotFoundException;
import com.angelica.recallpathbackend.document.repository.DocumentPageRepository;
import com.angelica.recallpathbackend.document.repository.DocumentRepository;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationContext;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationResult;
import com.angelica.recallpathbackend.features.generation.dto.GeneratedCardDto;
import com.angelica.recallpathbackend.features.generation.dto.GenerationRunRequest;
import com.angelica.recallpathbackend.features.generation.entity.GenerationRun;
import com.angelica.recallpathbackend.features.generation.entity.GenerationRunStatus;
import com.angelica.recallpathbackend.features.generation.exception.GenerationException;
import com.angelica.recallpathbackend.features.generation.repository.GenerationRunRepository;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardOrigin;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Orchestrates the generation lifecycle.
 *
 * <h3>Transactional strategy</h3>
 * The AI call runs OUTSIDE a transaction to avoid holding a DB connection
 * open during a potentially long HTTP request (up to 120 s).
 * Short transactions are used only for:
 * <ul>
 *   <li>PENDING + PROCESSING transitions.</li>
 *   <li>Saving validated candidates + COMPLETED.</li>
 *   <li>Setting FAILED on error.</li>
 * </ul>
 *
 * <h3>Error strategy</h3>
 * All safe user-facing messages come from {@link GenerationException}.
 * Internal details are logged but never propagated to the API response.
 */
@Service
public class GenerationRunServiceImpl implements GenerationRunService {

    private static final Logger log = LoggerFactory.getLogger(GenerationRunServiceImpl.class);

    private final GenerationRunRepository generationRunRepository;
    private final DocumentRepository documentRepository;
    private final DeckRepository deckRepository;
    private final DocumentPageRepository documentPageRepository;
    private final FlashcardGenerationService generationService;
    private final FlashcardRepository flashcardRepository;

    public GenerationRunServiceImpl(
            GenerationRunRepository generationRunRepository,
            DocumentRepository documentRepository,
            DeckRepository deckRepository,
            DocumentPageRepository documentPageRepository,
            FlashcardGenerationService generationService,
            FlashcardRepository flashcardRepository
    ) {
        this.generationRunRepository = generationRunRepository;
        this.documentRepository = documentRepository;
        this.deckRepository = deckRepository;
        this.documentPageRepository = documentPageRepository;
        this.generationService = generationService;
        this.flashcardRepository = flashcardRepository;
    }

    @Override
    public GenerationRun createGenerationRun(Long documentId, GenerationRunRequest request) {
        // ── Step 1: Validate inputs (no transaction needed for reads) ──────────
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        if (document.getStatus() != DocumentStatus.READY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El documento no está listo para extracción.");
        }

        Deck deck = deckRepository.findById(request.deckId())
                .orElseThrow(() -> new DeckNotFoundException(request.deckId()));

        if (deck.getArchivedAt() != null) {
            throw new ArchivedDeckModificationException(deck.getId());
        }

        if (request.pageFrom() > request.pageTo() || request.pageTo() > document.getPageCount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Intervalo de páginas inválido.");
        }

        // ── Step 2: Create PENDING run (short transaction) ────────────────────
        Long runId = createPendingRun(document, deck, request);

        // ── Step 3: Mark PROCESSING (short transaction) ───────────────────────
        markProcessing(runId);

        // ── Step 4: Build context ─────────────────────────────────────────────
        List<DocumentPage> pages = documentPageRepository
                .findByDocumentIdAndPageNumberBetweenOrderByPageNumberAsc(
                        documentId, request.pageFrom(), request.pageTo());

        java.util.Map<Integer, String> pageTexts = new java.util.HashMap<>();
        for (DocumentPage page : pages) {
            pageTexts.put(page.getPageNumber(), page.getExtractedText());
        }

        FlashcardGenerationContext context = new FlashcardGenerationContext(
                runId,
                pageTexts,
                request.pageFrom(),
                request.pageTo(),
                request.requestedCardCount(),
                request.language(),
                request.difficulty(),
                request.contentTypes()
        );

        // ── Step 5: Call AI (outside any transaction) ─────────────────────────
        FlashcardGenerationResult result;
        try {
            result = generationService.generate(context);
        } catch (GenerationException ge) {
            markFailed(runId, ge.getMessage());
            HttpStatus status = switch (ge.getGenerationCause()) {
                case AUTH_ERROR, UNEXPECTED -> HttpStatus.INTERNAL_SERVER_ERROR;
                case QUOTA_EXCEEDED, TIMEOUT -> HttpStatus.SERVICE_UNAVAILABLE;
                case SAFETY_BLOCKED -> HttpStatus.UNPROCESSABLE_ENTITY;
                case EMPTY_RESPONSE, INVALID_JSON, INVALID_SCHEMA -> HttpStatus.BAD_GATEWAY;
            };
            throw new ResponseStatusException(status, ge.getMessage());
        } catch (Exception e) {
            String correlationId = java.util.UUID.randomUUID().toString();
            String safeMessage = "No fue posible generar las tarjetas. (Ref: " + correlationId + ")";
            log.error("[GenerationRun] Error inesperado durante la generación (runId={}, ref={})", runId, correlationId, e);
            markFailed(runId, safeMessage);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, safeMessage);
        }

        // ── Step 6: Validate candidates + persist (short transaction) ─────────
        return persistResultAndComplete(runId, deck, result, context);
    }

    @Override
    @Transactional(readOnly = true)
    public GenerationRun getGenerationRun(Long runId) {
        return generationRunRepository.findById(runId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Generation run not found."));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers – each has its own short transaction
    // ──────────────────────────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    Long createPendingRun(Document document, Deck deck, GenerationRunRequest request) {
        GenerationRun run = new GenerationRun();
        run.setDocument(document);
        run.setDeck(deck);
        run.setStatus(GenerationRunStatus.PENDING);
        run.setSelectedPageFrom(request.pageFrom());
        run.setSelectedPageTo(request.pageTo());
        run.setRequestedCardCount(request.requestedCardCount());
        run.setLanguage(request.language());
        run.setDifficulty(request.difficulty());
        run.setProvider("PENDING");
        run.setModelName("pending");
        run.setPromptVersion("pending");
        return generationRunRepository.save(run).getId();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void markProcessing(Long runId) {
        generationRunRepository.findById(runId).ifPresent(r -> {
            r.setStatus(GenerationRunStatus.PROCESSING);
            r.setStartedAt(LocalDateTime.now());
            generationRunRepository.save(r);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    GenerationRun persistResultAndComplete(Long runId, Deck deck, FlashcardGenerationResult result,
                                            FlashcardGenerationContext context) {
        GenerationRun run = generationRunRepository.findById(runId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Generation run not found."));

        // Check for deck duplicates before persisting anything
        for (GeneratedCardDto dto : result.cards()) {
            if (flashcardRepository.existsEquivalentTermForStatuses(deck.getId(), dto.term())) {
                markFailed(runId, "Algunas tarjetas ya existen en el conjunto.");
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Algunas tarjetas ya existen en el conjunto.");
            }
        }

        // Persist all valid candidates
        for (GeneratedCardDto dto : result.cards()) {
            Flashcard card = new Flashcard();
            card.setDeck(deck);
            card.setTerm(dto.term());
            card.setDefinition(dto.definition());
            card.setCategory(dto.category());
            card.setDifficulty(dto.difficulty());
            card.setStatus(FlashcardStatus.GENERATED);
            card.setOrigin(FlashcardOrigin.AI_GENERATED);
            card.setGenerationRun(run);
            card.setSourcePage(dto.sourcePage());
            card.setSourceExcerpt(dto.sourceExcerpt());
            flashcardRepository.save(card);
        }

        run.setStatus(GenerationRunStatus.COMPLETED);
        run.setCompletedAt(LocalDateTime.now());
        run.setProvider(result.provider());
        run.setModelName(result.modelName());
        run.setPromptVersion(result.promptVersion());
        // rawResponse stored only for Gemini (useful for diagnostics); blank for Fake
        run.setRawResponse(result.rawResponse() != null && result.rawResponse().length() <= 65535
                ? result.rawResponse() : null);
        return generationRunRepository.save(run);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void markFailed(Long runId, String safeMessage) {
        generationRunRepository.findById(runId).ifPresent(r -> {
            r.setStatus(GenerationRunStatus.FAILED);
            r.setCompletedAt(LocalDateTime.now());
            r.setErrorMessage(safeMessage);
            generationRunRepository.save(r);
        });
    }
}
