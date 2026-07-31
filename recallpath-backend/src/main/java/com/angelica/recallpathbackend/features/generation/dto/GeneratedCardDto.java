package com.angelica.recallpathbackend.features.generation.dto;

import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;

public record GeneratedCardDto(
        String term,
        String definition,
        String sourceExcerpt,
        Integer sourcePage,
        String category,
        FlashcardDifficulty difficulty
) {}
