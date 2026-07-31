package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.config.GeminiProperties;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationContext;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationResult;
import com.angelica.recallpathbackend.features.generation.dto.GeneratedCardDto;
import com.angelica.recallpathbackend.features.generation.exception.GenerationException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class GeminiFlashcardGenerationServiceTest {

    private static final GeminiProperties PROPS = new GeminiProperties(
            "test-key",
            "gemini-3.5-flash-lite",
            30,
            4096
    );

    private final GeminiFlashcardGenerationService service =
            new GeminiFlashcardGenerationService(PROPS, null);

    private FlashcardGenerationContext ctx(int pageFrom, int pageTo, Map<Integer, String> pageTexts) {
        return new FlashcardGenerationContext(1L, pageTexts, pageFrom, pageTo, 5, "Español", "MEDIUM",
                List.of("KEY_CONCEPTS"));
    }

    // --- Normalizer Tests ---

    @Test
    void normalizer_ExactMatch() {
        String text = "El gato negro";
        assertThat(TextNormalizer.normalize(text)).isEqualTo("el gato negro");
    }

    @Test
    void normalizer_SpacesAndNewlines() {
        String text = "  El   gato \n negro  ";
        assertThat(TextNormalizer.normalize(text)).isEqualTo("el gato negro");
    }

    @Test
    void normalizer_HyphenatedWords() {
        String text = "fo-\nto"; // PDFBox often splits words at the end of a line
        assertThat(TextNormalizer.normalize(text)).isEqualTo("foto");
    }

    @Test
    void normalizer_NBSP() {
        String text = "hola\u00A0mundo";
        assertThat(TextNormalizer.normalize(text)).isEqualTo("hola mundo");
    }

    @Test
    void normalizer_CurvedQuotes() {
        String text = "“hola” ‘mundo’";
        assertThat(TextNormalizer.normalize(text)).isEqualTo("\"hola\" 'mundo'");
    }

    @Test
    void normalizer_LongDashes() {
        String text = "hola — mundo – test";
        assertThat(TextNormalizer.normalize(text)).isEqualTo("hola - mundo - test");
    }

    // --- Validation Logic Tests ---

    @Test
    void parsesValidJsonResponse_ExactMatch() {
        String json = """
                {
                  "cards": [
                    {
                      "term": "Fotosíntesis",
                      "definition": "Proceso por el que las plantas producen glucosa usando luz solar",
                      "category": "Biología",
                      "difficulty": "MEDIUM",
                      "sourcePage": 1,
                      "sourceExcerpt": "las plantas producen glucosa"
                    }
                  ]
                }
                """;

        FlashcardGenerationContext context = ctx(1, 3, Map.of(1, "las plantas producen glucosa usando luz solar", 2, "otra cosa"));
        GeminiFlashcardGenerationService.ValidationResult result = service.parseAndValidate(json, context);

        assertThat(result.invalidCards()).isEmpty();
        assertThat(result.validCards()).hasSize(1);
    }

    @Test
    void invalid_DifferentPage() {
        String json = """
                {
                  "cards": [
                    {
                      "term": "Term",
                      "definition": "Def",
                      "difficulty": "MEDIUM",
                      "sourcePage": 1,
                      "sourceExcerpt": "este texto esta en la pagina 2"
                    }
                  ]
                }
                """;
        FlashcardGenerationContext context = ctx(1, 3, Map.of(1, "nada", 2, "este texto esta en la pagina 2"));
        
        GeminiFlashcardGenerationService.ValidationResult result = service.parseAndValidate(json, context);
        assertThat(result.validCards()).isEmpty();
        assertThat(result.invalidCards()).hasSize(1);
        assertThat(result.invalidCards().get(0).reason()).contains("sourceExcerpt no encontrado en el texto original");
    }

    @Test
    void invalid_InventedExcerpt() {
        String json = """
                {
                  "cards": [
                    {
                      "term": "Term",
                      "definition": "Def",
                      "difficulty": "MEDIUM",
                      "sourcePage": 1,
                      "sourceExcerpt": "texto inventado"
                    }
                  ]
                }
                """;
        FlashcardGenerationContext context = ctx(1, 1, Map.of(1, "solo hay esto"));
        
        GeminiFlashcardGenerationService.ValidationResult result = service.parseAndValidate(json, context);
        assertThat(result.validCards()).isEmpty();
        assertThat(result.invalidCards()).hasSize(1);
    }

    @Test
    void valid_WithNormalizerDifferences() {
        String json = """
                {
                  "cards": [
                    {
                      "term": "Term",
                      "definition": "Def",
                      "difficulty": "MEDIUM",
                      "sourcePage": 1,
                      "sourceExcerpt": "un texto con comillas \\"rectas\\" y sin guiones"
                    }
                  ]
                }
                """;
        // PDFBox might extract curved quotes and soft hyphens
        String extracted = "un texto con comillas “rectas” y sin guio-\nnes";
        FlashcardGenerationContext context = ctx(1, 1, Map.of(1, extracted));
        
        GeminiFlashcardGenerationService.ValidationResult result = service.parseAndValidate(json, context);
        assertThat(result.invalidCards()).isEmpty();
        assertThat(result.validCards()).hasSize(1);
    }

    @Test
    void throwsOnEmptyCardsList() {
        String json = "{\"cards\": []}";
        FlashcardGenerationContext context = ctx(1, 1, Map.of(1, "text"));
        assertThatThrownBy(() -> service.parseAndValidate(json, context))
                .isInstanceOf(GenerationException.class)
                .extracting(e -> ((GenerationException) e).getGenerationCause())
                .isEqualTo(GenerationException.Cause.EMPTY_RESPONSE);
    }

    @Test
    void fakeServiceStillGeneratesCards() {
        FakeFlashcardGenerationService fake = new FakeFlashcardGenerationService();
        FlashcardGenerationContext context = ctx(1, 3, Map.of(1, "some text"));
        FlashcardGenerationResult result = fake.generate(context);

        assertThat(result.cards()).hasSize(5);
        assertThat(result.provider()).isEqualTo("FAKE");
    }
}
