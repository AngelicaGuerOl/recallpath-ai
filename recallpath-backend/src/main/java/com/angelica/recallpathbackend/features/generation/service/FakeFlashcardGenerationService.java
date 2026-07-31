package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationContext;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationResult;
import com.angelica.recallpathbackend.features.generation.dto.GeneratedCardDto;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class FakeFlashcardGenerationService implements FlashcardGenerationService {

    @Override
    public FlashcardGenerationResult generate(FlashcardGenerationContext context) {
        // Simular un fallo si el usuario pide exactamente 42 tarjetas o algo configurable.
        // Pero para ser más seguro, fallaremos si la dificultad es "FAIL_ME".
        if ("FAIL_ME".equals(context.difficulty())) {
            throw new RuntimeException("Simulated generation failure from FakeFlashcardGenerationService");
        }

        List<GeneratedCardDto> cards = new ArrayList<>();
        int count = context.requestedCardCount(); // Generar exactamente la cantidad solicitada
        long seed = context.pageTexts().hashCode();
        Random random = new Random(seed);

        for (int i = 1; i <= count; i++) {
            // El page debe ser determinista pero validado
            int pageToUse = context.pageFrom();
            if (context.pageTo() >= context.pageFrom()) {
                pageToUse = context.pageFrom() + random.nextInt(context.pageTo() - context.pageFrom() + 1);
            }

            FlashcardDifficulty diff = switch (context.difficulty().toUpperCase()) {
                case "EASY" -> FlashcardDifficulty.EASY;
                case "HARD" -> FlashcardDifficulty.HARD;
                default -> FlashcardDifficulty.MEDIUM;
            };

            // Asegurar que el término sea único dentro de este lote, pero determinista
            String uniqueTermSuffix = Math.abs(random.nextInt(10000)) + "_" + i;

            cards.add(new GeneratedCardDto(
                    "Término generado " + uniqueTermSuffix + " (" + context.language() + ")",
                    "Definición autogenerada para el término " + uniqueTermSuffix + " de prueba.",
                    "Fragmento de texto original de donde salió esto... (página " + pageToUse + ")",
                    pageToUse,
                    "Categoría Falsa",
                    diff
            ));
        }

        String rawResponse = "{\n  \"status\": \"success\",\n  \"message\": \"This is a fake raw response\"\n}";

        return new FlashcardGenerationResult(
                cards,
                rawResponse,
                "FAKE",
                "fake-model-1.0",
                "v1"
        );
    }
}
