package com.angelica.recallpathbackend.practice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class PracticeSessionNotFoundException extends RuntimeException {
    public PracticeSessionNotFoundException(Long id) {
        super("No se encontró la sesión de práctica con id: " + id);
    }
}
