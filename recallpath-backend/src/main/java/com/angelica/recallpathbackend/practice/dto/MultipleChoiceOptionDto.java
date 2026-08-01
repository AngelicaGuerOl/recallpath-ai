package com.angelica.recallpathbackend.practice.dto;

/**
 * Representa una opción en una pregunta de opción múltiple.
 *
 * @param text    Texto de la opción (definición de la flashcard).
 * @param correct {@code true} si es la respuesta correcta.
 */
public record MultipleChoiceOptionDto(String text, boolean correct) {}
