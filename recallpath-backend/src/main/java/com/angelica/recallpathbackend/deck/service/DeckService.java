package com.angelica.recallpathbackend.deck.service;

import com.angelica.recallpathbackend.deck.dto.CreateDeckRequest;
import com.angelica.recallpathbackend.deck.dto.DeckPageResponse;
import com.angelica.recallpathbackend.deck.dto.DeckResponse;
import com.angelica.recallpathbackend.deck.dto.UpdateDeckRequest;

public interface DeckService {

    DeckPageResponse findDecks(int page, int size, String search, Boolean archived);

    DeckResponse getDeck(Long id);

    DeckResponse createDeck(CreateDeckRequest request);

    DeckResponse updateDeck(Long id, UpdateDeckRequest request);

    DeckResponse archiveDeck(Long id);

    DeckResponse unarchiveDeck(Long id);
}
