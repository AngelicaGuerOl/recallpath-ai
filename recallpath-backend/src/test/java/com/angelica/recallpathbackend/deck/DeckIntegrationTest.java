package com.angelica.recallpathbackend.deck;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
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
class DeckIntegrationTest {

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
    private MockMvc mockMvc;

    @BeforeEach
    void cleanDatabase() {
        deckRepository.deleteAll();
    }

    @Test
    void flywayCreatesDecksTableAndDeckCanBePersisted() {
        Deck deck = new Deck();
        deck.setName("Spring Boot");
        deck.setDescription("Concepts");

        Deck saved = deckRepository.saveAndFlush(deck);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void postgresRejectsBlankName() {
        Deck deck = new Deck();
        deck.setName("   ");

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> deckRepository.saveAndFlush(deck))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void postDeckReturnsCreated() throws Exception {
        mockMvc.perform(post("/api/decks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":" Spring Boot ","description":" Concepts "}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Spring Boot"))
                .andExpect(jsonPath("$.description").value("Concepts"));
    }

    @Test
    void getDeckByIdReturnsOk() throws Exception {
        Deck saved = deckRepository.save(deck("PostgreSQL", null));

        mockMvc.perform(get("/api/decks/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.name").value("PostgreSQL"));
    }

    @Test
    void missingDeckReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/decks/{id}", 99999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void editingArchivedDeckReturnsConflict() throws Exception {
        Deck archived = deck("Archived", null);
        archived.setArchivedAt(LocalDateTime.now());
        Deck saved = deckRepository.save(archived);

        mockMvc.perform(put("/api/decks/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"New name","description":null}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void searchByNameWorks() throws Exception {
        deckRepository.save(deck("Spring Boot", null));
        deckRepository.save(deck("React", null));

        mockMvc.perform(get("/api/decks").param("search", "spring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Spring Boot"));
    }

    @Test
    void archivedFilterWorks() throws Exception {
        deckRepository.save(deck("Active", null));
        Deck archived = deck("Archived", null);
        archived.setArchivedAt(LocalDateTime.now());
        deckRepository.save(archived);

        mockMvc.perform(get("/api/decks").param("archived", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Archived"));
    }

    @Test
    void paginationReturnsMetadata() throws Exception {
        deckRepository.save(deck("Deck 1", null));
        deckRepository.save(deck("Deck 2", null));
        deckRepository.save(deck("Deck 3", null));

        mockMvc.perform(get("/api/decks").param("page", "0").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void archiveDeckSetsArchivedAt() throws Exception {
        Deck saved = deckRepository.save(deck("Algorithms", null));

        mockMvc.perform(patch("/api/decks/{id}/archive", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").exists());
    }

    private Deck deck(String name, String description) {
        Deck deck = new Deck();
        deck.setName(name);
        deck.setDescription(description);
        return deck;
    }
}
