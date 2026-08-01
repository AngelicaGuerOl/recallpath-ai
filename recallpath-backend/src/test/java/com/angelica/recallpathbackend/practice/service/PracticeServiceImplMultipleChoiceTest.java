package com.angelica.recallpathbackend.practice.service;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardOrigin;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import com.angelica.recallpathbackend.practice.dto.MultipleChoiceOptionDto;
import com.angelica.recallpathbackend.practice.entity.PracticeMode;
import com.angelica.recallpathbackend.practice.exception.InsufficientCardsForModeException;
import com.angelica.recallpathbackend.practice.mapper.PracticeMapper;
import com.angelica.recallpathbackend.practice.repository.PracticeAttemptRepository;
import com.angelica.recallpathbackend.practice.repository.PracticeSessionCardRepository;
import com.angelica.recallpathbackend.practice.repository.PracticeSessionRepository;
import com.angelica.recallpathbackend.practice.service.PracticeServiceImpl;
import com.angelica.recallpathbackend.features.generation.service.SemanticEvaluationService;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PracticeServiceImplMultipleChoiceTest {

    @Mock private PracticeSessionRepository sessionRepository;
    @Mock private PracticeSessionCardRepository sessionCardRepository;
    @Mock private PracticeAttemptRepository attemptRepository;
    @Mock private DeckRepository deckRepository;
    @Mock private FlashcardRepository flashcardRepository;
    @Mock private PracticeMapper practiceMapper;
    @Mock private SemanticEvaluationService semanticEvaluationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private PracticeServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PracticeServiceImpl(
                sessionRepository,
                sessionCardRepository,
                attemptRepository,
                deckRepository,
                flashcardRepository,
                practiceMapper,
                objectMapper,
                semanticEvaluationService);
    }

    // ─── buildOptionsSnapshot ───────────────────────────────────────────────

    @Test
    void buildOptionsSnapshot_producesExactlyFourOptions() throws Exception {
        Flashcard correct = card(1L, "Término 1", "Definición correcta");
        List<Flashcard> pool = pool(correct, 5);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        assertThat(options).hasSize(4);
    }

    @Test
    void buildOptionsSnapshot_exactlyOneCorrectOption() throws Exception {
        Flashcard correct = card(1L, "Término 1", "Definición correcta");
        List<Flashcard> pool = pool(correct, 5);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        long correctCount = options.stream().filter(MultipleChoiceOptionDto::correct).count();
        assertThat(correctCount).isEqualTo(1);
    }

    @Test
    void buildOptionsSnapshot_correctOptionTextMatchesDefinition() throws Exception {
        Flashcard correct = card(1L, "Término 1", "Definición correcta exacta");
        List<Flashcard> pool = pool(correct, 5);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        String correctText = options.stream()
                .filter(MultipleChoiceOptionDto::correct)
                .map(MultipleChoiceOptionDto::text)
                .findFirst()
                .orElseThrow();
        assertThat(correctText).isEqualTo("Definición correcta exacta");
    }

    @Test
    void buildOptionsSnapshot_noOptionDuplicates() throws Exception {
        Flashcard correct = card(1L, "T1", "Def A");
        List<Flashcard> pool = pool(correct, 5);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        long distinctTexts = options.stream()
                .map(o -> o.text().strip().toLowerCase())
                .distinct()
                .count();
        assertThat(distinctTexts).isEqualTo(options.size());
    }

    @Test
    void buildOptionsSnapshot_doesNotIncludeOwnDefinitionAsDistractor() throws Exception {
        Flashcard correct = card(1L, "T1", "Mi definición única");
        List<Flashcard> pool = pool(correct, 5);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        long occurrences = options.stream()
                .filter(o -> o.text().equalsIgnoreCase("Mi definición única"))
                .count();
        // Solo debe aparecer exactamente una vez: como la respuesta correcta
        assertThat(occurrences).isEqualTo(1);
    }

    @Test
    void buildOptionsSnapshot_excludesNearlyIdenticalDistractors() throws Exception {
        // La tarjeta correcta y el "distractor equivalente" solo difieren en espacios/mayúsculas
        Flashcard correct = card(1L, "T1", "Mitosis");
        Flashcard equivalent = card(2L, "T2", "  MITOSIS  "); // misma definición normalizada
        List<Flashcard> others = pool(correct, 4); // 4 distractores distintos
        List<Flashcard> pool = new ArrayList<>(others);
        pool.add(0, equivalent); // agregar el equivalente al pool
        pool.add(0, correct);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        // No debe aparecer "MITOSIS" como distractor (sería equivalente a la correcta)
        long mitosisCount = options.stream()
                .filter(o -> o.text().strip().equalsIgnoreCase("mitosis"))
                .count();
        assertThat(mitosisCount).isEqualTo(1); // solo la respuesta correcta
    }

    @Test
    void buildOptionsSnapshot_withMinimumFourCards_includesAllAsOptions() throws Exception {
        Flashcard correct = card(1L, "T1", "Def 1");
        Flashcard other1 = card(2L, "T2", "Def 2");
        Flashcard other2 = card(3L, "T3", "Def 3");
        Flashcard other3 = card(4L, "T4", "Def 4");
        List<Flashcard> pool = List.of(correct, other1, other2, other3);

        String json = service.buildOptionsSnapshot(correct, pool);
        List<MultipleChoiceOptionDto> options = deserialize(json);

        assertThat(options).hasSize(4);
        assertThat(options.stream().filter(MultipleChoiceOptionDto::correct)).hasSize(1);
    }

    // ─── Validación de mínimo de tarjetas ──────────────────────────────────

    @Test
    void startOrResumeSession_multipleChoice_withLessThanFourActiveCards_throwsInsufficientCards() {
        Deck deck = deck(1L);
        List<Flashcard> cards = List.of(
                card(1L, "T1", "D1"),
                card(2L, "T2", "D2"),
                card(3L, "T3", "D3")); // solo 3

        org.mockito.Mockito.when(deckRepository.findById(1L)).thenReturn(java.util.Optional.of(deck));
        org.mockito.Mockito.when(flashcardRepository.findByDeckIdAndStatus(1L, FlashcardStatus.ACTIVE))
                .thenReturn(cards);

        assertThatThrownBy(() ->
                service.startOrResumeSession(1L, PracticeMode.MULTIPLE_CHOICE, null, null))
                .isInstanceOf(InsufficientCardsForModeException.class)
                .hasMessageContaining("4");
    }

    @Test
    void startOrResumeSession_multipleChoice_withExactlyFourActiveCards_doesNotThrow() {
        Deck deck = deck(1L);
        List<Flashcard> cards = List.of(
                card(1L, "T1", "D1"),
                card(2L, "T2", "D2"),
                card(3L, "T3", "D3"),
                card(4L, "T4", "D4")); // exactamente 4

        org.mockito.Mockito.when(deckRepository.findById(1L)).thenReturn(java.util.Optional.of(deck));
        org.mockito.Mockito.when(flashcardRepository.findByDeckIdAndStatus(1L, FlashcardStatus.ACTIVE))
                .thenReturn(cards);
        org.mockito.Mockito.when(sessionRepository
                .findFirstByDeckIdAndModeAndStatusOrderByCreatedAtDesc(
                        org.mockito.ArgumentMatchers.anyLong(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.Optional.empty());

        // Configurar mocks mínimos para que save funcione
        com.angelica.recallpathbackend.practice.entity.PracticeSession savedSession =
                new com.angelica.recallpathbackend.practice.entity.PracticeSession();
        savedSession.setId(10L);
        savedSession.setDeck(deck);
        savedSession.setMode(PracticeMode.MULTIPLE_CHOICE);
        savedSession.setStatus(com.angelica.recallpathbackend.practice.entity.PracticeStatus.IN_PROGRESS);
        savedSession.setTotalCards(4);
        savedSession.setCompletedCards(0);
        org.mockito.Mockito.when(sessionRepository.save(org.mockito.ArgumentMatchers.any()))
                .thenReturn(savedSession);
        org.mockito.Mockito.when(sessionRepository.findById(10L))
                .thenReturn(java.util.Optional.of(savedSession));
        org.mockito.Mockito.when(practiceMapper.toSessionResponse(
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any()))
                .thenReturn(null);

        // No debe lanzar excepción
        assertThatCode(() ->
                service.startOrResumeSession(1L, PracticeMode.MULTIPLE_CHOICE, null, null))
                .doesNotThrowAnyException();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private List<MultipleChoiceOptionDto> deserialize(String json) throws Exception {
        return objectMapper.readValue(json, new TypeReference<>() {});
    }

    private Flashcard card(Long id, String term, String definition) {
        Flashcard f = new Flashcard();
        f.setId(id);
        f.setTerm(term);
        f.setDefinition(definition);
        f.setDifficulty(FlashcardDifficulty.MEDIUM);
        f.setStatus(FlashcardStatus.ACTIVE);
        f.setOrigin(FlashcardOrigin.MANUAL);
        return f;
    }

    /**
     * Construye un pool con la tarjeta correcta más {@code distractorCount} tarjetas adicionales.
     */
    private List<Flashcard> pool(Flashcard correct, int distractorCount) {
        List<Flashcard> pool = new ArrayList<>();
        pool.add(correct);
        IntStream.rangeClosed(2, distractorCount + 1).forEach(i ->
                pool.add(card((long) i, "T" + i, "Def " + i)));
        return pool;
    }

    private Deck deck(Long id) {
        Deck d = new Deck();
        d.setId(id);
        d.setName("Test Deck");
        d.setCreatedAt(LocalDateTime.now());
        d.setUpdatedAt(LocalDateTime.now());
        return d;
    }
}
