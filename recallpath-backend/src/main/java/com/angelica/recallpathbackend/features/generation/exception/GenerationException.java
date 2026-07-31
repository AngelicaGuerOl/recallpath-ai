package com.angelica.recallpathbackend.features.generation.exception;

/**
 * Domain exception that carries a safe, user-facing message.
 * Internal details (API key, stack trace, JSON) are NEVER included.
 */
public class GenerationException extends RuntimeException {

    public enum Cause {
        AUTH_ERROR,
        QUOTA_EXCEEDED,
        TIMEOUT,
        EMPTY_RESPONSE,
        INVALID_JSON,
        INVALID_SCHEMA,
        SAFETY_BLOCKED,
        UNEXPECTED
    }

    private final Cause cause;

    public GenerationException(Cause cause, String safeMessage) {
        super(safeMessage);
        this.cause = cause;
    }

    public Cause getGenerationCause() {
        return cause;
    }
}
