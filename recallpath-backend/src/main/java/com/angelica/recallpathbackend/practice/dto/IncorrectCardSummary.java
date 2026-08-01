package com.angelica.recallpathbackend.practice.dto;

/**
 * Resumen de una tarjeta respondida incorrectamente en una sesión de práctica.
 * Se incluye en {@link PracticeSummaryResponse} para que el frontend pueda mostrar
 * los errores y ofrecer el modo "repetir solo incorrectas".
 */
public record IncorrectCardSummary(String term, String definition, String userAnswer, String feedback) {}
