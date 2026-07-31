package com.angelica.recallpathbackend.flashcard.dto;

import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFlashcardRequest(
        @NotBlank(message = "Term is required")
        String term,

        @NotBlank(message = "Definition is required")
        String definition,

        @Size(max = 120, message = "Category must not exceed 120 characters")
        String category,

        @NotNull(message = "Difficulty is required")
        FlashcardDifficulty difficulty
) {
}
