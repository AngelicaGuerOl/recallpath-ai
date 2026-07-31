package com.angelica.recallpathbackend.flashcard.exception;

public class DuplicateFlashcardTermException extends RuntimeException {

    public DuplicateFlashcardTermException(Long deckId) {
        super("A flashcard with an equivalent term already exists in deck " + deckId);
    }
}
