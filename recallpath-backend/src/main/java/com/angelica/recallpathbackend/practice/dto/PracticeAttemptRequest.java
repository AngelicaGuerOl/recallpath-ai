package com.angelica.recallpathbackend.practice.dto;

public record PracticeAttemptRequest(
    String result,
    Long responseTimeMs,
    String userAnswer
) {}
