package com.angelica.recallpathbackend.practice.service;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.exception.DeckNotFoundException;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import com.angelica.recallpathbackend.practice.dto.PracticeAttemptRequest;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSummaryResponse;
import com.angelica.recallpathbackend.practice.entity.*;
import com.angelica.recallpathbackend.practice.exception.InvalidPracticeStateException;
import com.angelica.recallpathbackend.practice.exception.PracticeSessionNotFoundException;
import com.angelica.recallpathbackend.practice.mapper.PracticeMapper;
import com.angelica.recallpathbackend.practice.repository.PracticeAttemptRepository;
import com.angelica.recallpathbackend.practice.repository.PracticeSessionCardRepository;
import com.angelica.recallpathbackend.practice.repository.PracticeSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class PracticeServiceImpl implements PracticeService {

    private final PracticeSessionRepository sessionRepository;
    private final PracticeSessionCardRepository sessionCardRepository;
    private final PracticeAttemptRepository attemptRepository;
    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final PracticeMapper practiceMapper;

    public PracticeServiceImpl(
            PracticeSessionRepository sessionRepository,
            PracticeSessionCardRepository sessionCardRepository,
            PracticeAttemptRepository attemptRepository,
            DeckRepository deckRepository,
            FlashcardRepository flashcardRepository,
            PracticeMapper practiceMapper) {
        this.sessionRepository = sessionRepository;
        this.sessionCardRepository = sessionCardRepository;
        this.attemptRepository = attemptRepository;
        this.deckRepository = deckRepository;
        this.flashcardRepository = flashcardRepository;
        this.practiceMapper = practiceMapper;
    }

    @Override
    @Transactional
    public PracticeSessionResponse startOrResumeSession(Long deckId, PracticeMode mode) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));

        if (deck.getArchivedAt() != null) {
            throw new InvalidPracticeStateException("No se puede iniciar una práctica de un conjunto archivado");
        }

        Optional<PracticeSession> existingSession = sessionRepository
                .findFirstByDeckIdAndModeAndStatusOrderByCreatedAtDesc(deckId, mode, PracticeStatus.IN_PROGRESS);

        if (existingSession.isPresent()) {
            return getSession(existingSession.get().getId());
        }

        List<Flashcard> activeCards = flashcardRepository.findByDeckIdAndStatus(deckId, FlashcardStatus.ACTIVE);
        
        if (activeCards.isEmpty()) {
            throw new InvalidPracticeStateException("El conjunto no tiene tarjetas activas para practicar");
        }

        // Shuffle cards
        Collections.shuffle(activeCards);

        PracticeSession session = new PracticeSession();
        session.setDeck(deck);
        session.setMode(mode);
        session.setStatus(PracticeStatus.IN_PROGRESS);
        session.setTotalCards(activeCards.size());
        session.setCompletedCards(0);
        
        session = sessionRepository.save(session);

        int position = 1;
        for (Flashcard card : activeCards) {
            PracticeSessionCard sessionCard = new PracticeSessionCard();
            sessionCard.setSession(session);
            sessionCard.setFlashcard(card);
            sessionCard.setPosition(position++);
            sessionCard.setTermSnapshot(card.getTerm());
            sessionCard.setDefinitionSnapshot(card.getDefinition());
            sessionCard.setCategorySnapshot(card.getCategory());
            sessionCard.setDifficultySnapshot(card.getDifficulty().name());
            sessionCard.setAnswered(false);
            sessionCardRepository.save(sessionCard);
        }

        return getSession(session.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PracticeSessionResponse getSession(Long sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new PracticeSessionNotFoundException(sessionId));

        PracticeSessionCard currentCard = null;
        if (session.getStatus() == PracticeStatus.IN_PROGRESS) {
            currentCard = sessionCardRepository
                    .findFirstBySessionIdAndAnsweredFalseOrderByPositionAsc(sessionId)
                    .orElse(null);
        }

        return practiceMapper.toSessionResponse(session, currentCard);
    }

    @Override
    @Transactional
    public PracticeSessionResponse submitCardResult(Long sessionId, Long sessionCardId, PracticeAttemptRequest request) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new PracticeSessionNotFoundException(sessionId));

        if (session.getStatus() != PracticeStatus.IN_PROGRESS) {
            throw new InvalidPracticeStateException("La sesión ya no está en progreso");
        }

        PracticeSessionCard sessionCard = sessionCardRepository.findById(sessionCardId)
                .orElseThrow(() -> new InvalidPracticeStateException("Tarjeta de sesión no encontrada"));

        if (!sessionCard.getSession().getId().equals(sessionId)) {
            throw new InvalidPracticeStateException("La tarjeta no pertenece a la sesión indicada");
        }

        if (sessionCard.getAnswered()) {
            throw new InvalidPracticeStateException("La tarjeta ya fue respondida en esta sesión");
        }

        // Identify current pending card
        PracticeSessionCard expectedCard = sessionCardRepository
                .findFirstBySessionIdAndAnsweredFalseOrderByPositionAsc(sessionId)
                .orElseThrow(() -> new InvalidPracticeStateException("No hay tarjetas pendientes"));

        if (!expectedCard.getId().equals(sessionCardId)) {
            throw new InvalidPracticeStateException("La tarjeta respondida no es la actual");
        }

        PracticeResult result = PracticeResult.valueOf(request.result().toUpperCase());

        PracticeAttempt attempt = new PracticeAttempt();
        attempt.setSessionCard(sessionCard);
        attempt.setResult(result);
        attempt.setResponseTimeMs(request.responseTimeMs());
        attemptRepository.save(attempt);

        sessionCard.setAnswered(true);
        sessionCardRepository.save(sessionCard);

        session.setCompletedCards(session.getCompletedCards() + 1);

        // Update flashcard progression
        Flashcard flashcard = sessionCard.getFlashcard();
        updateFlashcardProgress(flashcard, result);
        flashcardRepository.save(flashcard);

        // Check if finished
        if (session.getCompletedCards().equals(session.getTotalCards())) {
            session.setStatus(PracticeStatus.COMPLETED);
            session.setCompletedAt(LocalDateTime.now());
        }

        sessionRepository.save(session);

        return getSession(sessionId);
    }

    private void updateFlashcardProgress(Flashcard flashcard, PracticeResult result) {
        flashcard.setLastReviewedAt(LocalDateTime.now());
        LocalDate today = LocalDate.now();

        switch (result) {
            case INCORRECT -> {
                flashcard.setNextReviewDate(today.plusDays(1));
                flashcard.setCorrectStreak(0);
            }
            case DIFFICULT -> {
                flashcard.setNextReviewDate(today.plusDays(2));
                // correct_streak no aumenta
            }
            case CORRECT -> {
                flashcard.setNextReviewDate(today.plusDays(5));
                flashcard.setCorrectStreak(flashcard.getCorrectStreak() + 1);
            }
            case EASY -> {
                flashcard.setNextReviewDate(today.plusDays(10));
                flashcard.setCorrectStreak(flashcard.getCorrectStreak() + 1);
            }
        }
    }

    @Override
    @Transactional
    public void cancelSession(Long sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new PracticeSessionNotFoundException(sessionId));

        if (session.getStatus() != PracticeStatus.IN_PROGRESS) {
            throw new InvalidPracticeStateException("Solo se pueden cancelar sesiones en progreso");
        }

        session.setStatus(PracticeStatus.CANCELLED);
        session.setCancelledAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    @Transactional(readOnly = true)
    public PracticeSummaryResponse getSessionSummary(Long sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new PracticeSessionNotFoundException(sessionId));

        List<PracticeAttempt> attempts = attemptRepository.findBySessionCardSessionId(sessionId);

        int incorrect = 0;
        int difficult = 0;
        int correct = 0;
        int easy = 0;

        for (PracticeAttempt attempt : attempts) {
            switch (attempt.getResult()) {
                case INCORRECT -> incorrect++;
                case DIFFICULT -> difficult++;
                case CORRECT -> correct++;
                case EASY -> easy++;
            }
        }

        int totalAnswered = attempts.size();
        int accuracy = 0;
        if (totalAnswered > 0) {
            accuracy = (int) Math.round(((double) (correct + easy) / totalAnswered) * 100);
        }

        return new PracticeSummaryResponse(
                session.getTotalCards(),
                incorrect,
                difficult,
                correct,
                easy,
                accuracy,
                session.getStartedAt(),
                session.getCompletedAt()
        );
    }
}
