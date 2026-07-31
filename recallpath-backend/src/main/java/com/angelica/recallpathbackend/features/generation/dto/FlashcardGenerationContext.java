package com.angelica.recallpathbackend.features.generation.dto;

import java.util.List;
import java.util.Map;

public record FlashcardGenerationContext(
        Long runId,
        Map<Integer, String> pageTexts,
        int pageFrom,
        int pageTo,
        int requestedCardCount,
        String language,
        String difficulty,
        List<String> contentTypes
) {}
