package com.angelica.recallpathbackend.deck.exception;

import com.angelica.recallpathbackend.shared.exception.ResourceNotFoundException;

public class DeckNotFoundException extends ResourceNotFoundException {

    public DeckNotFoundException(Long id) {
        super("Deck with id " + id + " was not found");
    }
}
