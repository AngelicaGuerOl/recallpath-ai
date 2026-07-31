package com.angelica.recallpathbackend.features.generation.dto;

import java.util.List;

public record FlashcardGenerationContext(
        String fullText,
        int pageFrom,
        int pageTo,
        int requestedCardCount,
        String language,
        String difficulty,
        List<String> contentTypes
) {}
