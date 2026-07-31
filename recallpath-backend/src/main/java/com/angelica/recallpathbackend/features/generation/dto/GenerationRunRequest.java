package com.angelica.recallpathbackend.features.generation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record GenerationRunRequest(
        @NotNull
        Long deckId,

        @Min(1)
        int pageFrom,

        @Min(1)
        int pageTo,

        @Min(1)
        @Max(50)
        int requestedCardCount,

        @NotBlank
        String language,

        @NotBlank
        String difficulty,

        @NotEmpty
        List<String> contentTypes
) {}
