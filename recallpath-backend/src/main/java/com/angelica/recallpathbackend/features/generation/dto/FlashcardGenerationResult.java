package com.angelica.recallpathbackend.features.generation.dto;

import java.util.List;

public record FlashcardGenerationResult(
        List<GeneratedCardDto> cards,
        String rawResponse,
        String provider,
        String modelName,
        String promptVersion
) {}
