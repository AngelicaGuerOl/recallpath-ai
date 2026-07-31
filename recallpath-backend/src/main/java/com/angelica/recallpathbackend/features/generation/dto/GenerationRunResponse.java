package com.angelica.recallpathbackend.features.generation.dto;

import com.angelica.recallpathbackend.features.generation.entity.GenerationRunStatus;
import java.time.LocalDateTime;

public record GenerationRunResponse(
        Long id,
        Long documentId,
        Long deckId,
        GenerationRunStatus status,
        Integer selectedPageFrom,
        Integer selectedPageTo,
        Integer requestedCardCount,
        String language,
        String difficulty,
        String errorMessage,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        LocalDateTime createdAt
) {}
