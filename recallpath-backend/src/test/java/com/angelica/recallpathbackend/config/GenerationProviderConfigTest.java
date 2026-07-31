package com.angelica.recallpathbackend.config;

import com.angelica.recallpathbackend.features.generation.service.FakeFlashcardGenerationService;
import com.angelica.recallpathbackend.features.generation.service.GeminiFlashcardGenerationService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that exactly one FlashcardGenerationService bean is registered
 * based on the app.ai.provider property.
 */
class GenerationProviderConfigTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(GenerationProviderConfig.class);

    @Test
    void fakeProviderRegisteredByDefault() {
        runner.run(ctx -> {
            assertThat(ctx).hasSingleBean(
                    com.angelica.recallpathbackend.features.generation.service.FlashcardGenerationService.class);
            assertThat(ctx.getBean(
                    com.angelica.recallpathbackend.features.generation.service.FlashcardGenerationService.class))
                    .isInstanceOf(FakeFlashcardGenerationService.class);
        });
    }

    @Test
    void fakeProviderRegisteredWhenExplicitlySet() {
        runner.withPropertyValues("app.ai.provider=fake")
                .run(ctx -> {
                    assertThat(ctx.getBean(
                            com.angelica.recallpathbackend.features.generation.service.FlashcardGenerationService.class))
                            .isInstanceOf(FakeFlashcardGenerationService.class);
                });
    }

    @Test
    void backendStartsWithFakeWithoutApiKey() {
        runner.withPropertyValues("app.ai.provider=fake")
                .run(ctx -> assertThat(ctx).hasNotFailed());
    }

    @Test
    void geminiProviderRegisteredWithApiKey() {
        runner.withPropertyValues(
                        "app.ai.provider=gemini",
                        "app.ai.gemini.api-key=fake-key-for-test",
                        "app.ai.gemini.model=gemini-3.5-flash-lite",
                        "app.ai.gemini.timeout-seconds=30",
                        "app.ai.gemini.max-output-tokens=4096"
                )
                .run(ctx -> {
                    assertThat(ctx).hasNotFailed();
                    assertThat(ctx.getBean(
                            com.angelica.recallpathbackend.features.generation.service.FlashcardGenerationService.class))
                            .isInstanceOf(GeminiFlashcardGenerationService.class);
                });
    }

    @Test
    void geminiProviderFailsToStartWithoutApiKey() {
        runner.withPropertyValues(
                        "app.ai.provider=gemini",
                        "app.ai.gemini.api-key=",
                        "app.ai.gemini.model=gemini-3.5-flash-lite",
                        "app.ai.gemini.timeout-seconds=30",
                        "app.ai.gemini.max-output-tokens=4096"
                )
                .run(ctx -> assertThat(ctx).hasFailed()
                        .getFailure()
                        .hasMessageContaining("GEMINI_API_KEY"));
    }
}
