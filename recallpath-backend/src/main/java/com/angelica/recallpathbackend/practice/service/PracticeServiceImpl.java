package com.angelica.recallpathbackend.practice.service;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.exception.DeckNotFoundException;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import com.angelica.recallpathbackend.practice.dto.IncorrectCardSummary;
import com.angelica.recallpathbackend.practice.dto.MultipleChoiceOptionDto;
import com.angelica.recallpathbackend.practice.dto.PracticeAttemptRequest;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSummaryResponse;
import com.angelica.recallpathbackend.practice.entity.*;
import com.angelica.recallpathbackend.practice.exception.InsufficientCardsForModeException;
import com.angelica.recallpathbackend.practice.exception.InvalidPracticeStateException;
import com.angelica.recallpathbackend.practice.exception.PracticeSessionNotFoundException;
import com.angelica.recallpathbackend.practice.mapper.PracticeMapper;
import com.angelica.recallpathbackend.practice.repository.PracticeAttemptRepository;
import com.angelica.recallpathbackend.practice.repository.PracticeSessionCardRepository;
import com.angelica.recallpathbackend.practice.repository.PracticeSessionRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.angelica.recallpathbackend.features.generation.service.SemanticEvaluationService;
import com.angelica.recallpathbackend.practice.dto.EvaluationResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PracticeServiceImpl implements PracticeService {

    /** Número total de opciones en una pregunta de opción múltiple (1 correcta + 3 distractores). */
    private static final int MC_TOTAL_OPTIONS = 4;

    private final PracticeSessionRepository sessionRepository;
    private final PracticeSessionCardRepository sessionCardRepository;
    private final PracticeAttemptRepository attemptRepository;
    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;
    private final PracticeMapper practiceMapper;
    private final ObjectMapper objectMapper;
    private final SemanticEvaluationService semanticEvaluationService;

    public PracticeServiceImpl(
            PracticeSessionRepository sessionRepository,
            PracticeSessionCardRepository sessionCardRepository,
            PracticeAttemptRepository attemptRepository,
            DeckRepository deckRepository,
            FlashcardRepository flashcardRepository,
            PracticeMapper practiceMapper,
            ObjectMapper objectMapper,
            SemanticEvaluationService semanticEvaluationService) {
        this.sessionRepository = sessionRepository;
        this.sessionCardRepository = sessionCardRepository;
        this.attemptRepository = attemptRepository;
        this.deckRepository = deckRepository;
        this.flashcardRepository = flashcardRepository;
        this.practiceMapper = practiceMapper;
        this.objectMapper = objectMapper;
        this.semanticEvaluationService = semanticEvaluationService;
    }

    @Override
    @Transactional
    public PracticeSessionResponse startOrResumeSession(
            Long deckId,
            PracticeMode mode,
            Boolean incorrectOnly,
            Long sourceSessionId) {

        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));

        if (deck.getArchivedAt() != null) {
            throw new InvalidPracticeStateException("No se puede iniciar una práctica de un conjunto archivado");
        }

        boolean isIncorrectOnly = Boolean.TRUE.equals(incorrectOnly) && sourceSessionId != null;

        // Intentar reanudar sesión existente solo cuando no es modo "solo incorrectas"
        if (!isIncorrectOnly) {
            Optional<PracticeSession> existing = sessionRepository
                    .findFirstByDeckIdAndModeAndStatusOrderByCreatedAtDesc(deckId, mode, PracticeStatus.IN_PROGRESS);
            if (existing.isPresent()) {
                return getSession(existing.get().getId());
            }
        }

        // Obtener todas las tarjetas activas del deck (sirve como pool de distractores)
        List<Flashcard> allActiveCards = flashcardRepository.findByDeckIdAndStatus(deckId, FlashcardStatus.ACTIVE);

        // Validar mínimo para el pool de distractores en MULTIPLE_CHOICE
        if (mode == PracticeMode.MULTIPLE_CHOICE && allActiveCards.size() < MC_TOTAL_OPTIONS) {
            throw new InsufficientCardsForModeException(
                    "El conjunto necesita al menos 4 tarjetas activas para practicar con opción múltiple.");
        }

        // Determinar qué tarjetas incluir en la sesión
        List<Flashcard> cardsForSession;
        if (isIncorrectOnly) {
            List<Long> incorrectIds = attemptRepository
                    .findFlashcardIdsBySessionIdAndResult(sourceSessionId, PracticeResult.INCORRECT);
            if (incorrectIds.isEmpty()) {
                throw new InvalidPracticeStateException("No hay tarjetas incorrectas para repasar");
            }
            Set<Long> incorrectSet = new HashSet<>(incorrectIds);
            cardsForSession = allActiveCards.stream()
                    .filter(c -> incorrectSet.contains(c.getId()))
                    .collect(Collectors.toCollection(ArrayList::new));
            if (cardsForSession.isEmpty()) {
                throw new InvalidPracticeStateException(
                        "Las tarjetas respondidas incorrectamente ya no están disponibles para práctica");
            }
        } else {
            if (allActiveCards.isEmpty()) {
                throw new InvalidPracticeStateException("El conjunto no tiene tarjetas activas para practicar");
            }
            cardsForSession = new ArrayList<>(allActiveCards);
        }

        // Mezclar el orden de las preguntas
        Collections.shuffle(cardsForSession);

        PracticeSession session = new PracticeSession();
        session.setDeck(deck);
        session.setMode(mode);
        session.setStatus(PracticeStatus.IN_PROGRESS);
        session.setTotalCards(cardsForSession.size());
        session.setCompletedCards(0);
        session = sessionRepository.save(session);

        int position = 1;
        for (Flashcard card : cardsForSession) {
            PracticeSessionCard sessionCard = new PracticeSessionCard();
            sessionCard.setSession(session);
            sessionCard.setFlashcard(card);
            sessionCard.setPosition(position++);
            sessionCard.setTermSnapshot(card.getTerm());
            sessionCard.setDefinitionSnapshot(card.getDefinition());
            sessionCard.setCategorySnapshot(card.getCategory());
            sessionCard.setDifficultySnapshot(card.getDifficulty().name());
            sessionCard.setAnswered(false);

            if (mode == PracticeMode.MULTIPLE_CHOICE) {
                // Los distractores se toman del pool completo de tarjetas activas
                sessionCard.setOptionsSnapshot(buildOptionsSnapshot(card, allActiveCards));
            }

            sessionCardRepository.save(sessionCard);
        }

        return getSession(session.getId());
    }

    /**
     * Construye y serializa las 4 opciones de una pregunta de opción múltiple.
     *
     * <p>Reglas:
     * <ul>
     *   <li>Respuesta correcta: definición de {@code correct}.</li>
     *   <li>Distractores: definiciones de otras tarjetas activas del mismo deck.</li>
     *   <li>Excluye la propia tarjeta, opciones vacías y equivalentes (normalizado).</li>
     *   <li>Mezcla la posición de la respuesta correcta.</li>
     * </ul>
     */
    String buildOptionsSnapshot(Flashcard correct, List<Flashcard> pool) {
        String correctDef = correct.getDefinition();
        String normalizedCorrect = normalize(correctDef);

        // Candidatos a distractor: otras tarjetas con definición no equivalente a la correcta
        List<String> distractorCandidates = pool.stream()
                .filter(c -> !c.getId().equals(correct.getId()))
                .filter(c -> c.getDefinition() != null && !c.getDefinition().isBlank())
                .filter(c -> !normalize(c.getDefinition()).equals(normalizedCorrect))
                .sorted(Comparator.<Flashcard, Integer>comparing(c -> 
                        Objects.equals(c.getCategory(), correct.getCategory()) ? 0 : 1
                ).thenComparingInt(c -> 
                        Math.abs(c.getDefinition().length() - correctDef.length())
                ))
                .map(Flashcard::getDefinition)
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));

        // Tomar los mejores candidatos (hasta 10) para mantener variabilidad, luego mezclar
        List<String> topCandidates = distractorCandidates.stream().limit(10).collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(topCandidates);

        List<MultipleChoiceOptionDto> options = new ArrayList<>();
        options.add(new MultipleChoiceOptionDto(correctDef, true));

        topCandidates.stream()
                .limit((long) MC_TOTAL_OPTIONS - 1)
                .map(def -> new MultipleChoiceOptionDto(def, false))
                .forEach(options::add);

        // Mezclar para que la correcta no siempre aparezca en la misma posición
        Collections.shuffle(options);

        try {
            return objectMapper.writeValueAsString(options);
        } catch (JacksonException e) {
            throw new IllegalStateException("Error al serializar las opciones de opción múltiple", e);
        }
    }

    /**
     * Normaliza un texto para comparar equivalencia: recorta espacios, colapsa
     * espacios internos múltiples y convierte a minúsculas.
     */
    private String normalize(String s) {
        if (s == null) return "";
        return s.strip().replaceAll("\\s+", " ").toLowerCase(java.util.Locale.ROOT);
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

        // Verificar que es la tarjeta actualmente pendiente
        PracticeSessionCard expectedCard = sessionCardRepository
                .findFirstBySessionIdAndAnsweredFalseOrderByPositionAsc(sessionId)
                .orElseThrow(() -> new InvalidPracticeStateException("No hay tarjetas pendientes"));

        if (!expectedCard.getId().equals(sessionCardId)) {
            throw new InvalidPracticeStateException("La tarjeta respondida no es la actual");
        }

        PracticeResult result;
        String feedback = null;
        String provider = null;
        String model = null;

        if (session.getMode() == PracticeMode.WRITTEN_RESPONSE) {
            if (request.userAnswer() == null || request.userAnswer().isBlank()) {
                throw new InvalidPracticeStateException("La respuesta no puede estar vacía.");
            }
            EvaluationResponse eval = semanticEvaluationService.evaluate(
                    sessionCard.getTermSnapshot(),
                    sessionCard.getDefinitionSnapshot(),
                    request.userAnswer()
            );
            result = eval.correct() ? PracticeResult.CORRECT : PracticeResult.INCORRECT;
            feedback = eval.feedback();
            provider = semanticEvaluationService.getProviderName();
            model = semanticEvaluationService.getModelName();
        } else {
            if (request.result() == null) {
                throw new InvalidPracticeStateException("El resultado es obligatorio en este modo.");
            }
            result = PracticeResult.valueOf(request.result().toUpperCase());
        }

        PracticeAttempt attempt = new PracticeAttempt();
        attempt.setSessionCard(sessionCard);
        attempt.setResult(result);
        attempt.setResponseTimeMs(request.responseTimeMs());
        attempt.setUserAnswer(request.userAnswer());
        attempt.setFeedback(feedback);
        attempt.setProvider(provider);
        attempt.setModel(model);
        attemptRepository.save(attempt);

        sessionCard.setAnswered(true);
        sessionCardRepository.save(sessionCard);

        session.setCompletedCards(session.getCompletedCards() + 1);

        // Actualizar progresión de la flashcard
        Flashcard flashcard = sessionCard.getFlashcard();
        updateFlashcardProgress(flashcard, result);
        flashcardRepository.save(flashcard);

        // Comprobar si terminó la sesión
        if (session.getCompletedCards().equals(session.getTotalCards())) {
            session.setStatus(PracticeStatus.COMPLETED);
            session.setCompletedAt(LocalDateTime.now());
        }

        sessionRepository.save(session);

        EvaluationResponse evalResponse = null;
        if (session.getMode() == PracticeMode.WRITTEN_RESPONSE) {
            evalResponse = new EvaluationResponse(result == PracticeResult.CORRECT, feedback);
        }

        PracticeSessionResponse sessionResp = getSession(sessionId);
        return new PracticeSessionResponse(
            sessionResp.id(), sessionResp.deckId(), sessionResp.mode(), sessionResp.status(),
            sessionResp.totalCards(), sessionResp.completedCards(), sessionResp.currentCard(),
            evalResponse, sessionResp.startedAt(), sessionResp.completedAt()
        );
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

        List<IncorrectCardSummary> incorrectCards = attempts.stream()
                .filter(a -> a.getResult() == PracticeResult.INCORRECT)
                .map(a -> new IncorrectCardSummary(
                        a.getSessionCard().getTermSnapshot(),
                        a.getSessionCard().getDefinitionSnapshot(),
                        a.getUserAnswer(),
                        a.getFeedback()))
                .toList();

        return new PracticeSummaryResponse(
                session.getTotalCards(),
                incorrect,
                difficult,
                correct,
                easy,
                accuracy,
                session.getStartedAt(),
                session.getCompletedAt(),
                incorrectCards);
    }
}
