package com.angelica.recallpathbackend.practice.dto;

import java.time.LocalDateTime;

public record PracticeSummaryResponse(
    Integer totalCards,
    Integer incorrectCount,
    Integer difficultCount,
    Integer correctCount,
    Integer easyCount,
    Integer accuracyPercentage,
    LocalDateTime startedAt,
    LocalDateTime completedAt
) {}
