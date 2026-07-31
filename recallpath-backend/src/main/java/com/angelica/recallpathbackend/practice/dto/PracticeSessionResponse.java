package com.angelica.recallpathbackend.practice.dto;

import java.time.LocalDateTime;

public record PracticeSessionResponse(
    Long id,
    Long deckId,
    String mode,
    String status,
    Integer totalCards,
    Integer completedCards,
    PracticeSessionCardResponse currentCard,
    LocalDateTime startedAt,
    LocalDateTime completedAt
) {}
