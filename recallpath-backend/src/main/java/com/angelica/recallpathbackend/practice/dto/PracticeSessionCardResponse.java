package com.angelica.recallpathbackend.practice.dto;

import java.util.List;

public record PracticeSessionCardResponse(
    Long id,
    Integer position,
    String termSnapshot,
    String definitionSnapshot,
    String categorySnapshot,
    String difficultySnapshot,
    Boolean answered,
    /**
     * Opciones de opción múltiple. Solo se rellena cuando
     * {@code PracticeSession.mode == MULTIPLE_CHOICE}; {@code null} en las demás sesiones.
     */
    List<MultipleChoiceOptionDto> options
) {}
