package com.angelica.recallpathbackend.practice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidPracticeStateException extends RuntimeException {
    public InvalidPracticeStateException(String message) {
        super(message);
    }
}
