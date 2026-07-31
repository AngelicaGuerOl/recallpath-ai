package com.angelica.recallpathbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound to app.ai.gemini.* properties.
 * The API key is NEVER logged or exposed to the frontend.
 */
@ConfigurationProperties(prefix = "app.ai.gemini")
public record GeminiProperties(
        String apiKey,
        String model,
        int timeoutSeconds,
        int maxOutputTokens
) {}
