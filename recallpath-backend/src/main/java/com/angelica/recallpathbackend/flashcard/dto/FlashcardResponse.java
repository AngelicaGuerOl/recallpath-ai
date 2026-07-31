package com.angelica.recallpathbackend.flashcard.dto;

import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import java.time.LocalDateTime;

public record FlashcardResponse(
        Long id,
        Long deckId,
        String term,
        String definition,
        String category,
        FlashcardDifficulty difficulty,
        FlashcardStatus status,
        com.angelica.recallpathbackend.flashcard.entity.FlashcardOrigin origin,
        Long generationRunId,
        Integer sourcePage,
        String sourceExcerpt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
