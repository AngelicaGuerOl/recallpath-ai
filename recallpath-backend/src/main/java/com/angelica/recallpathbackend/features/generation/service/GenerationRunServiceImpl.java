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
import com.angelica.recallpathbackend.features.generation.repository.GenerationRunRepository;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardOrigin;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class GenerationRunServiceImpl implements GenerationRunService {

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
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public GenerationRun createGenerationRun(Long documentId, GenerationRunRequest request) {
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

        // Crear PENDING run
        GenerationRun run = new GenerationRun();
        run.setDocument(document);
        run.setDeck(deck);
        run.setStatus(GenerationRunStatus.PENDING);
        run.setSelectedPageFrom(request.pageFrom());
        run.setSelectedPageTo(request.pageTo());
        run.setRequestedCardCount(request.requestedCardCount());
        run.setLanguage(request.language());
        run.setDifficulty(request.difficulty());
        run.setProvider("FAKE");
        run.setModelName("pending");
        run.setPromptVersion("pending");
        run = generationRunRepository.save(run);

        // Transición a PROCESSING (en vida real esto podría ser un worker asíncrono, aquí es síncrono para el demo)
        run.setStatus(GenerationRunStatus.PROCESSING);
        run.setStartedAt(LocalDateTime.now());
        run = generationRunRepository.saveAndFlush(run);

        try {
            // Concatenar texto de páginas solicitadas
            List<DocumentPage> pages = documentPageRepository.findByDocumentIdAndPageNumberBetweenOrderByPageNumberAsc(documentId, request.pageFrom(), request.pageTo());
            StringBuilder fullText = new StringBuilder();
            for (DocumentPage page : pages) {
                fullText.append(page.getExtractedText()).append("\n\n");
            }

            FlashcardGenerationContext context = new FlashcardGenerationContext(
                    fullText.toString(),
                    request.pageFrom(),
                    request.pageTo(),
                    request.requestedCardCount(),
                    request.language(),
                    request.difficulty(),
                    request.contentTypes()
            );

            FlashcardGenerationResult result = generationService.generate(context);

            run.setRawResponse(result.rawResponse());
            run.setProvider(result.provider());
            run.setModelName(result.modelName());
            run.setPromptVersion(result.promptVersion());
            run.setStatus(GenerationRunStatus.COMPLETED);
            run.setCompletedAt(LocalDateTime.now());

            // Guardar tarjetas generadas (verificar duplicados primero)
            for (GeneratedCardDto dto : result.cards()) {
                if (flashcardRepository.existsEquivalentTermForStatuses(deck.getId(), dto.term())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Algunas tarjetas ya existen en el conjunto.");
                }
            }

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

            return generationRunRepository.save(run);

        } catch (Exception ex) {
            run.setStatus(GenerationRunStatus.FAILED);
            run.setCompletedAt(LocalDateTime.now());
            run.setErrorMessage(ex.getMessage());
            generationRunRepository.saveAndFlush(run);
            
            if (ex instanceof ResponseStatusException) {
                throw ex;
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno en la generación", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public GenerationRun getGenerationRun(Long runId) {
        return generationRunRepository.findById(runId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Generation run not found."));
    }
}
