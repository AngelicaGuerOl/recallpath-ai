package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationContext;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationResult;

public interface FlashcardGenerationService {
    FlashcardGenerationResult generate(FlashcardGenerationContext context);
}
