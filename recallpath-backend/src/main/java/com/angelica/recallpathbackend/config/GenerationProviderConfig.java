package com.angelica.recallpathbackend.config;

import com.angelica.recallpathbackend.features.generation.service.FakeFlashcardGenerationService;
import com.angelica.recallpathbackend.features.generation.service.FlashcardGenerationService;
import com.angelica.recallpathbackend.features.generation.service.GeminiFlashcardGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Selects exactly one FlashcardGenerationService bean based on the
 * {@code app.ai.provider} property (default: {@code fake}).
 *
 * <ul>
 *   <li>{@code fake}   – uses FakeFlashcardGenerationService; no API key required.</li>
 *   <li>{@code gemini} – uses GeminiFlashcardGenerationService; requires GEMINI_API_KEY.</li>
 * </ul>
 *
 * When the provider is {@code gemini} and the key is blank, the application
 * refuses to start with a clear, secure error message (no key value is logged).
 */
@Configuration
@EnableConfigurationProperties(GeminiProperties.class)
public class GenerationProviderConfig {

    private static final Logger log = LoggerFactory.getLogger(GenerationProviderConfig.class);

    @Bean
    @ConditionalOnProperty(name = "app.ai.provider", havingValue = "fake", matchIfMissing = true)
    public FlashcardGenerationService fakeFlashcardGenerationService() {
        log.info("[AI] Using provider: FAKE (no real API calls will be made)");
        return new FakeFlashcardGenerationService();
    }

    @Bean
    @ConditionalOnProperty(name = "app.ai.provider", havingValue = "gemini")
    public FlashcardGenerationService geminiFlashcardGenerationService(GeminiProperties props) {
        String key = props.apiKey();
        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "La generación con IA no está configurada: GEMINI_API_KEY es obligatoria cuando AI_PROVIDER=gemini. " +
                    "Consulta .env.example para instrucciones de configuración.");
        }
        log.info("[AI] Using provider: GEMINI (model={})", props.model());
        return new GeminiFlashcardGenerationService(props);
    }
}
