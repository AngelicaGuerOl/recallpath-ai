package com.angelica.recallpathbackend.deck;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.angelica.recallpathbackend.deck.dto.CreateDeckRequest;
import com.angelica.recallpathbackend.deck.dto.DeckResponse;
import com.angelica.recallpathbackend.deck.dto.UpdateDeckRequest;
import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.exception.ArchivedDeckModificationException;
import com.angelica.recallpathbackend.deck.exception.DeckNotFoundException;
import com.angelica.recallpathbackend.deck.mapper.DeckMapper;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import com.angelica.recallpathbackend.deck.service.DeckServiceImpl;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class DeckServiceImplTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-07-29T15:00:00Z"), ZoneId.of("UTC"));

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private DeckMapper deckMapper;

    private DeckServiceImpl deckService;

    @BeforeEach
    void setUp() {
        deckService = new DeckServiceImpl(deckRepository, deckMapper, FIXED_CLOCK);
    }

    @Test
    void createDeckTrimsName() {
        CreateDeckRequest request = new CreateDeckRequest("  Spring Boot  ", "Description");
        Deck entity = new Deck();
        Deck saved = deck(1L, "Spring Boot", "Description");
        when(deckMapper.toEntity(any(CreateDeckRequest.class))).thenReturn(entity);
        when(deckRepository.save(entity)).thenReturn(saved);
        when(deckMapper.toResponse(saved)).thenReturn(response(saved));

        deckService.createDeck(request);

        ArgumentCaptor<CreateDeckRequest> captor = ArgumentCaptor.forClass(CreateDeckRequest.class);
        verify(deckMapper).toEntity(captor.capture());
        assertThat(captor.getValue().name()).isEqualTo("Spring Boot");
    }

    @Test
    void createDeckConvertsEmptyDescriptionToNull() {
        CreateDeckRequest request = new CreateDeckRequest("Spring Boot", "   ");
        Deck entity = new Deck();
        Deck saved = deck(1L, "Spring Boot", null);
        when(deckMapper.toEntity(any(CreateDeckRequest.class))).thenReturn(entity);
        when(deckRepository.save(entity)).thenReturn(saved);
        when(deckMapper.toResponse(saved)).thenReturn(response(saved));

        deckService.createDeck(request);

        ArgumentCaptor<CreateDeckRequest> captor = ArgumentCaptor.forClass(CreateDeckRequest.class);
        verify(deckMapper).toEntity(captor.capture());
        assertThat(captor.getValue().description()).isNull();
    }

    @Test
    void createDeckSetsArchivedAtToNull() {
        Deck entity = new Deck();
        entity.setArchivedAt(LocalDateTime.now());
        Deck saved = deck(1L, "Spring Boot", null);
        when(deckMapper.toEntity(any(CreateDeckRequest.class))).thenReturn(entity);
        when(deckRepository.save(entity)).thenReturn(saved);
        when(deckMapper.toResponse(saved)).thenReturn(response(saved));

        deckService.createDeck(new CreateDeckRequest("Spring Boot", null));

        assertThat(entity.getArchivedAt()).isNull();
    }

    @Test
    void getDeckReturnsExistingDeck() {
        Deck deck = deck(1L, "Spring Boot", null);
        DeckResponse expected = response(deck);
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deck));
        when(deckMapper.toResponse(deck)).thenReturn(expected);

        DeckResponse result = deckService.getDeck(1L);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void getDeckThrowsWhenDeckDoesNotExist() {
        when(deckRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deckService.getDeck(99L))
                .isInstanceOf(DeckNotFoundException.class);
    }

    @Test
    void updateDeckModifiesNameAndDescription() {
        Deck deck = deck(1L, "Old", "Old description");
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 1, 10, 0);
        deck.setCreatedAt(createdAt);
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deck));
        when(deckRepository.save(deck)).thenReturn(deck);
        when(deckMapper.toResponse(deck)).thenReturn(response(deck));

        deckService.updateDeck(1L, new UpdateDeckRequest("  New  ", "  New description  "));

        ArgumentCaptor<UpdateDeckRequest> captor = ArgumentCaptor.forClass(UpdateDeckRequest.class);
        verify(deckMapper).updateEntity(captor.capture(), eq(deck));
        assertThat(captor.getValue().name()).isEqualTo("New");
        assertThat(captor.getValue().description()).isEqualTo("New description");
    }

    @Test
    void updateDeckDoesNotModifyProtectedFieldsInService() {
        Deck deck = deck(1L, "Old", "Old description");
        LocalDateTime archivedAt = null;
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 1, 10, 0);
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 2, 10, 0);
        deck.setArchivedAt(archivedAt);
        deck.setCreatedAt(createdAt);
        deck.setUpdatedAt(updatedAt);
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deck));
        when(deckRepository.save(deck)).thenReturn(deck);
        when(deckMapper.toResponse(deck)).thenReturn(response(deck));

        deckService.updateDeck(1L, new UpdateDeckRequest("New", null));

        assertThat(deck.getId()).isEqualTo(1L);
        assertThat(deck.getArchivedAt()).isEqualTo(archivedAt);
        assertThat(deck.getCreatedAt()).isEqualTo(createdAt);
        assertThat(deck.getUpdatedAt()).isEqualTo(updatedAt);
    }

    @Test
    void updateArchivedDeckThrowsConflictException() {
        Deck deck = deck(1L, "Old", null);
        deck.setArchivedAt(LocalDateTime.now());
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deck));

        assertThatThrownBy(() -> deckService.updateDeck(1L, new UpdateDeckRequest("New", null)))
                .isInstanceOf(ArchivedDeckModificationException.class);
        verify(deckRepository, never()).save(any());
    }

    @Test
    void archiveDeckAssignsCurrentDate() {
        Deck deck = deck(1L, "Spring Boot", null);
        when(deckRepository.findById(1L)).thenReturn(Optional.of(deck));
        when(deckRepository.save(deck)).thenReturn(deck);
        when(deckMapper.toResponse(deck)).thenReturn(response(deck));

        deckService.archiveDeck(1L);

        assertThat(deck.getArchivedAt()).isEqualTo(LocalDateTime.of(2026, 7, 29, 15, 0));
    }

    @Test
    void findDecksNormalizesSearchText() {
        when(deckRepository.search(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        deckService.findDecks(0, 20, "  spring  ", null);

        verify(deckRepository).search(eq("spring"), eq(Boolean.FALSE), any(Pageable.class));
    }

    @Test
    void findDecksPassesArchivedFilterToRepository() {
        when(deckRepository.search(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        deckService.findDecks(0, 20, null, Boolean.TRUE);

        verify(deckRepository).search(eq(""), eq(Boolean.TRUE), any(Pageable.class));
    }

    private Deck deck(Long id, String name, String description) {
        Deck deck = new Deck();
        deck.setId(id);
        deck.setName(name);
        deck.setDescription(description);
        deck.setCreatedAt(LocalDateTime.of(2026, 7, 1, 10, 0));
        deck.setUpdatedAt(LocalDateTime.of(2026, 7, 1, 10, 0));
        return deck;
    }

    private DeckResponse response(Deck deck) {
        return new DeckResponse(deck.getId(), deck.getName(), deck.getDescription(), deck.getArchivedAt(), deck.getCreatedAt(), deck.getUpdatedAt());
    }
}
