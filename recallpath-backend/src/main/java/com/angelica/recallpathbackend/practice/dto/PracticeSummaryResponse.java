package com.angelica.recallpathbackend.practice.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PracticeSummaryResponse(
    Integer totalCards,
    Integer incorrectCount,
    Integer difficultCount,
    Integer correctCount,
    Integer easyCount,
    Integer accuracyPercentage,
    LocalDateTime startedAt,
    LocalDateTime completedAt,
    /**
     * Lista de tarjetas respondidas incorrectamente.
     * Útil para mostrar los errores al usuario y para el flujo
     * "practicar solo incorrectas" en el modo de opción múltiple.
     */
    List<IncorrectCardSummary> incorrectCards
) {}
