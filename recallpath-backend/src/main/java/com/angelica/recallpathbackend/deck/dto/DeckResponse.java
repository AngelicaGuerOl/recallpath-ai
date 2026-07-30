package com.angelica.recallpathbackend.deck.dto;

import java.time.LocalDateTime;

public record DeckResponse(
        Long id,
        String name,
        String description,
        LocalDateTime archivedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
