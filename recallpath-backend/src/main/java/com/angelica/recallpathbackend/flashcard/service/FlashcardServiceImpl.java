package com.angelica.recallpathbackend.flashcard.service;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.exception.ArchivedDeckModificationException;
import com.angelica.recallpathbackend.deck.exception.DeckNotFoundException;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import com.angelica.recallpathbackend.flashcard.dto.ApproveBatchRequest;
import com.angelica.recallpathbackend.flashcard.dto.CreateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.dto.FlashcardResponse;
import com.angelica.recallpathbackend.flashcard.dto.UpdateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.exception.DuplicateFlashcardTermException;
import com.angelica.recallpathbackend.flashcard.exception.FlashcardNotFoundException;
import com.angelica.recallpathbackend.flashcard.mapper.FlashcardMapper;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FlashcardServiceImpl implements FlashcardService {

    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardMapper flashcardMapper;

    public FlashcardServiceImpl(
            DeckRepository deckRepository,
            FlashcardRepository flashcardRepository,
            FlashcardMapper flashcardMapper
    ) {
        this.deckRepository = deckRepository;
        this.flashcardRepository = flashcardRepository;
        this.flashcardMapper = flashcardMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardResponse> findFlashcards(Long deckId) {
        ensureDeckExists(deckId);
        return flashcardRepository.findByDeckIdAndStatusOrderByCreatedAtDescIdDesc(deckId, FlashcardStatus.ACTIVE).stream()
                .map(flashcardMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardResponse> findGeneratedFlashcardsByRun(Long runId) {
        return flashcardRepository.findByGenerationRunIdAndStatusOrderByIdAsc(runId, FlashcardStatus.GENERATED).stream()
                .map(flashcardMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardResponse> findFlashcardsByStatus(Long deckId, FlashcardStatus status) {
        ensureDeckExists(deckId);
        return flashcardRepository.findByDeckIdAndStatus(deckId, status).stream()
                .map(flashcardMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public FlashcardResponse createFlashcard(Long deckId, CreateFlashcardRequest request) {
        Deck deck = findMutableDeck(deckId);
        CreateFlashcardRequest normalized = normalize(request);
        ensureUniqueTerm(deckId, null, normalized.term());

        Flashcard flashcard = flashcardMapper.toEntity(normalized);
        flashcard.setDeck(deck);
        flashcard.setStatus(FlashcardStatus.ACTIVE);
        return flashcardMapper.toResponse(flashcardRepository.save(flashcard));
    }

    @Override
    @Transactional
    public FlashcardResponse updateFlashcard(Long deckId, Long cardId, UpdateFlashcardRequest request) {
        findMutableDeck(deckId);
        Flashcard flashcard = findFlashcard(deckId, cardId);
        UpdateFlashcardRequest normalized = normalize(request);
        ensureUniqueTerm(deckId, cardId, normalized.term());

        flashcardMapper.updateEntity(normalized, flashcard);
        return flashcardMapper.toResponse(flashcardRepository.save(flashcard));
    }

    @Override
    @Transactional
    public FlashcardResponse archiveFlashcard(Long deckId, Long cardId) {
        findMutableDeck(deckId);
        Flashcard flashcard = findFlashcard(deckId, cardId);
        flashcard.setStatus(FlashcardStatus.ARCHIVED);
        return flashcardMapper.toResponse(flashcardRepository.save(flashcard));
    }

    @Override
    @Transactional
    public FlashcardResponse restoreFlashcard(Long deckId, Long cardId) {
        findMutableDeck(deckId);
        Flashcard flashcard = findFlashcard(deckId, cardId);
        flashcard.setStatus(FlashcardStatus.ACTIVE);
        return flashcardMapper.toResponse(flashcardRepository.save(flashcard));
    }

    @Override
    @Transactional
    public FlashcardResponse approveFlashcard(Long deckId, Long cardId) {
        findMutableDeck(deckId);
        Flashcard flashcard = findFlashcard(deckId, cardId);
        if (flashcard.getStatus() != FlashcardStatus.GENERATED) {
            throw new IllegalStateException("Solo las tarjetas GENERATED pueden ser aprobadas.");
        }
        ensureUniqueTerm(deckId, cardId, flashcard.getTerm());
        flashcard.setStatus(FlashcardStatus.ACTIVE);
        return flashcardMapper.toResponse(flashcardRepository.save(flashcard));
    }

    @Override
    @Transactional
    public FlashcardResponse rejectFlashcard(Long deckId, Long cardId) {
        findMutableDeck(deckId);
        Flashcard flashcard = findFlashcard(deckId, cardId);
        if (flashcard.getStatus() != FlashcardStatus.GENERATED) {
            throw new IllegalStateException("Solo las tarjetas GENERATED pueden ser rechazadas.");
        }
        flashcard.setStatus(FlashcardStatus.REJECTED);
        return flashcardMapper.toResponse(flashcardRepository.save(flashcard));
    }

    @Override
    @Transactional
    public void approveBatch(Long deckId, ApproveBatchRequest request) {
        findMutableDeck(deckId);
        for (Long cardId : request.flashcardIds()) {
            Flashcard flashcard = findFlashcard(deckId, cardId);
            if (flashcard.getStatus() != FlashcardStatus.GENERATED) {
                throw new IllegalStateException("Todas las tarjetas del lote deben ser GENERATED.");
            }
            ensureUniqueTerm(deckId, cardId, flashcard.getTerm());
            flashcard.setStatus(FlashcardStatus.ACTIVE);
            flashcardRepository.save(flashcard);
        }
    }

    private Deck findMutableDeck(Long deckId) {
        Deck deck = findDeck(deckId);
        if (deck.getArchivedAt() != null) {
            throw new ArchivedDeckModificationException(deckId);
        }
        return deck;
    }

    private Deck findDeck(Long deckId) {
        return deckRepository.findById(deckId).orElseThrow(() -> new DeckNotFoundException(deckId));
    }

    private void ensureDeckExists(Long deckId) {
        if (!deckRepository.existsById(deckId)) {
            throw new DeckNotFoundException(deckId);
        }
    }

    private Flashcard findFlashcard(Long deckId, Long cardId) {
        return flashcardRepository.findByIdAndDeckId(cardId, deckId)
                .orElseThrow(() -> new FlashcardNotFoundException(deckId, cardId));
    }

    private void ensureUniqueTerm(Long deckId, Long excludedId, String term) {
        long normalizedExcludedId = excludedId == null ? -1L : excludedId;
        if (flashcardRepository.existsEquivalentTerm(deckId, normalizedExcludedId, term)) {
            throw new DuplicateFlashcardTermException(deckId);
        }
    }

    private CreateFlashcardRequest normalize(CreateFlashcardRequest request) {
        return new CreateFlashcardRequest(
                trimRequired(request.term()),
                trimRequired(request.definition()),
                normalizeOptional(request.category()),
                request.difficulty()
        );
    }

    private UpdateFlashcardRequest normalize(UpdateFlashcardRequest request) {
        return new UpdateFlashcardRequest(
                trimRequired(request.term()),
                trimRequired(request.definition()),
                normalizeOptional(request.category()),
                request.difficulty()
        );
    }

    private String trimRequired(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
