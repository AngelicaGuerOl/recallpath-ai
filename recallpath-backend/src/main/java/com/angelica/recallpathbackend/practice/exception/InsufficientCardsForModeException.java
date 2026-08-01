package com.angelica.recallpathbackend.practice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Se lanza cuando el deck no tiene suficientes tarjetas activas para
 * satisfacer los requisitos de un modo de práctica concreto.
 * <p>
 * Ejemplo: opción múltiple necesita al menos 4 tarjetas activas para
 * poder construir distractores plausibles.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientCardsForModeException extends RuntimeException {

    public InsufficientCardsForModeException(String message) {
        super(message);
    }
}
