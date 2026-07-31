package com.angelica.recallpathbackend.flashcard.exception;

import com.angelica.recallpathbackend.shared.exception.ResourceNotFoundException;

public class FlashcardNotFoundException extends ResourceNotFoundException {

    public FlashcardNotFoundException(Long deckId, Long cardId) {
        super("Flashcard with id " + cardId + " was not found in deck " + deckId);
    }
}
