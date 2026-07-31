package com.angelica.recallpathbackend.flashcard;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import com.angelica.recallpathbackend.flashcard.entity.Flashcard;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import com.angelica.recallpathbackend.flashcard.repository.FlashcardRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class FlashcardIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void cleanDatabase() {
        flashcardRepository.deleteAll();
        deckRepository.deleteAll();
    }

    @Test
    void createValidFlashcard() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));

        mockMvc.perform(post("/api/decks/{deckId}/flashcards", deck.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"  Bean  ","definition":"  Managed object  ","category":"  Spring  ","difficulty":"MEDIUM"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deckId").value(deck.getId()))
                .andExpect(jsonPath("$.term").value("Bean"))
                .andExpect(jsonPath("$.definition").value("Managed object"))
                .andExpect(jsonPath("$.category").value("Spring"))
                .andExpect(jsonPath("$.difficulty").value("MEDIUM"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void rejectBlankTerm() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));

        mockMvc.perform(post("/api/decks/{deckId}/flashcards", deck.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"   ","definition":"Definition","category":null,"difficulty":"EASY"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.term").value("Term is required"));
    }

    @Test
    void rejectBlankDefinition() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));

        mockMvc.perform(post("/api/decks/{deckId}/flashcards", deck.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"Bean","definition":"   ","category":null,"difficulty":"EASY"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.definition").value("Definition is required"));
    }

    @Test
    void rejectDuplicateEquivalentTermInSameDeck() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));
        flashcardRepository.save(flashcard(deck, "SQL   Basics", "Definition"));

        mockMvc.perform(post("/api/decks/{deckId}/flashcards", deck.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":" sql basics ","definition":"Another definition","category":null,"difficulty":"MEDIUM"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void allowSameTermInAnotherDeck() throws Exception {
        Deck firstDeck = deckRepository.save(deck("Spring Boot"));
        Deck secondDeck = deckRepository.save(deck("PostgreSQL"));
        flashcardRepository.save(flashcard(firstDeck, "Index", "Definition"));

        mockMvc.perform(post("/api/decks/{deckId}/flashcards", secondDeck.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":" index ","definition":"Other deck definition","category":null,"difficulty":"HARD"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deckId").value(secondDeck.getId()))
                .andExpect(jsonPath("$.term").value("index"));
    }

    @Test
    void rejectChangesInArchivedDeck() throws Exception {
        Deck deck = deck("Archived deck");
        deck.setArchivedAt(LocalDateTime.now());
        Deck archived = deckRepository.save(deck);

        mockMvc.perform(post("/api/decks/{deckId}/flashcards", archived.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"Bean","definition":"Definition","category":null,"difficulty":"EASY"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void archiveAndRestoreFlashcard() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));
        Flashcard flashcard = flashcardRepository.save(flashcard(deck, "Bean", "Definition"));

        mockMvc.perform(patch("/api/decks/{deckId}/flashcards/{cardId}/archive", deck.getId(), flashcard.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(patch("/api/decks/{deckId}/flashcards/{cardId}/restore", deck.getId(), flashcard.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void listOnlyFlashcardsFromRequestedDeck() throws Exception {
        Deck requestedDeck = deckRepository.save(deck("Spring Boot"));
        Deck otherDeck = deckRepository.save(deck("PostgreSQL"));
        flashcardRepository.save(flashcard(requestedDeck, "Bean", "Definition"));
        flashcardRepository.save(flashcard(otherDeck, "Index", "Other definition"));

        mockMvc.perform(get("/api/decks/{deckId}/flashcards", requestedDeck.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].term").value("Bean"))
                .andExpect(jsonPath("$[0].deckId").value(requestedDeck.getId()));
    }

    @Test
    void listOnlyActiveFlashcardsByDefault() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));
        
        Flashcard active = flashcard(deck, "Active", "Def");
        active.setStatus(FlashcardStatus.ACTIVE);
        flashcardRepository.save(active);
        
        Flashcard generated = flashcard(deck, "Generated", "Def");
        generated.setStatus(FlashcardStatus.GENERATED);
        flashcardRepository.save(generated);
        
        Flashcard archived = flashcard(deck, "Archived", "Def");
        archived.setStatus(FlashcardStatus.ARCHIVED);
        flashcardRepository.save(archived);

        mockMvc.perform(get("/api/decks/{deckId}/flashcards", deck.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].term").value("Active"));
    }

    @Test
    void missingDeckReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/decks/{deckId}/flashcards", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void missingFlashcardReturnsNotFound() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));

        mockMvc.perform(put("/api/decks/{deckId}/flashcards/{cardId}", deck.getId(), 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"Bean","definition":"Definition","category":null,"difficulty":"EASY"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateFlashcardOnlyThroughItsDeck() throws Exception {
        Deck firstDeck = deckRepository.save(deck("Spring Boot"));
        Deck secondDeck = deckRepository.save(deck("PostgreSQL"));
        Flashcard flashcard = flashcardRepository.save(flashcard(firstDeck, "Bean", "Definition"));

        mockMvc.perform(put("/api/decks/{deckId}/flashcards/{cardId}", secondDeck.getId(), flashcard.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"Updated","definition":"Definition","category":null,"difficulty":"EASY"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateFlashcardTrimsValues() throws Exception {
        Deck deck = deckRepository.save(deck("Spring Boot"));
        Flashcard flashcard = flashcardRepository.save(flashcard(deck, "Bean", "Definition"));

        mockMvc.perform(put("/api/decks/{deckId}/flashcards/{cardId}", deck.getId(), flashcard.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"term":"  Component  ","definition":"  Stereotype  ","category":"  Spring  ","difficulty":"HARD"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.term").value("Component"))
                .andExpect(jsonPath("$.definition").value("Stereotype"))
                .andExpect(jsonPath("$.category").value("Spring"))
                .andExpect(jsonPath("$.difficulty").value("HARD"));
    }

    private Deck deck(String name) {
        Deck deck = new Deck();
        deck.setName(name);
        return deck;
    }

    private Flashcard flashcard(Deck deck, String term, String definition) {
        Flashcard flashcard = new Flashcard();
        flashcard.setDeck(deck);
        flashcard.setTerm(term);
        flashcard.setDefinition(definition);
        flashcard.setDifficulty(FlashcardDifficulty.MEDIUM);
        flashcard.setStatus(FlashcardStatus.ACTIVE);
        return flashcard;
    }
}
