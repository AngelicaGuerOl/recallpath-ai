package com.angelica.recallpathbackend.deck.service;

import com.angelica.recallpathbackend.deck.dto.CreateDeckRequest;
import com.angelica.recallpathbackend.deck.dto.DeckPageResponse;
import com.angelica.recallpathbackend.deck.dto.DeckResponse;
import com.angelica.recallpathbackend.deck.dto.UpdateDeckRequest;
import com.angelica.recallpathbackend.deck.entity.Deck;
import com.angelica.recallpathbackend.deck.exception.ArchivedDeckModificationException;
import com.angelica.recallpathbackend.deck.exception.DeckNotFoundException;
import com.angelica.recallpathbackend.deck.mapper.DeckMapper;
import com.angelica.recallpathbackend.deck.repository.DeckRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeckServiceImpl implements DeckService {

    private static final int MAX_PAGE_SIZE = 100;

    private final DeckRepository deckRepository;
    private final DeckMapper deckMapper;
    private final Clock clock;

    public DeckServiceImpl(DeckRepository deckRepository, DeckMapper deckMapper, Clock clock) {
        this.deckRepository = deckRepository;
        this.deckMapper = deckMapper;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public DeckPageResponse findDecks(int page, int size, String search, Boolean archived) {
        int normalizedSize = Math.min(size, MAX_PAGE_SIZE);
        Page<Deck> result = deckRepository.search(
                normalizeSearch(search),
                archived,
                PageRequest.of(page, normalizedSize, Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")))
        );
        List<DeckResponse> content = result.getContent().stream().map(deckMapper::toResponse).toList();
        return new DeckPageResponse(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isFirst(), result.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public DeckResponse getDeck(Long id) {
        return deckMapper.toResponse(findDeck(id));
    }

    @Override
    @Transactional
    public DeckResponse createDeck(CreateDeckRequest request) {
        Deck deck = deckMapper.toEntity(normalize(request));
        deck.setArchivedAt(null);
        return deckMapper.toResponse(deckRepository.save(deck));
    }

    @Override
    @Transactional
    public DeckResponse updateDeck(Long id, UpdateDeckRequest request) {
        Deck deck = findDeck(id);
        if (deck.getArchivedAt() != null) {
            throw new ArchivedDeckModificationException(id);
        }
        deckMapper.updateEntity(normalize(request), deck);
        return deckMapper.toResponse(deckRepository.save(deck));
    }

    @Override
    @Transactional
    public DeckResponse archiveDeck(Long id) {
        Deck deck = findDeck(id);
        if (deck.getArchivedAt() == null) {
            deck.setArchivedAt(LocalDateTime.now(clock));
            deck = deckRepository.save(deck);
        }
        return deckMapper.toResponse(deck);
    }

    @Override
    @Transactional
    public DeckResponse unarchiveDeck(Long id) {
        Deck deck = findDeck(id);
        if (deck.getArchivedAt() != null) {
            deck.setArchivedAt(null);
            deck = deckRepository.save(deck);
        }
        return deckMapper.toResponse(deck);
    }

    private Deck findDeck(Long id) {
        return deckRepository.findById(id).orElseThrow(() -> new DeckNotFoundException(id));
    }

    private CreateDeckRequest normalize(CreateDeckRequest request) {
        return new CreateDeckRequest(trimRequired(request.name()), normalizeOptional(request.description()));
    }

    private UpdateDeckRequest normalize(UpdateDeckRequest request) {
        return new UpdateDeckRequest(trimRequired(request.name()), normalizeOptional(request.description()));
    }

    private String trimRequired(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeSearch(String value) {
        return value == null ? "" : value.trim();
    }
}
