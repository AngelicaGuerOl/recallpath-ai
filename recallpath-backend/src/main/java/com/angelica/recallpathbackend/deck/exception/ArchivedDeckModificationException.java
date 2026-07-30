package com.angelica.recallpathbackend.deck.exception;

public class ArchivedDeckModificationException extends RuntimeException {

    public ArchivedDeckModificationException(Long id) {
        super("Archived deck with id " + id + " cannot be modified");
    }
}
