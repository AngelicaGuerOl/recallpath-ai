package com.angelica.recallpathbackend.practice.dto;

import java.time.LocalDateTime;

public record PracticeSessionCardResponse(
    Long id,
    Integer position,
    String termSnapshot,
    String definitionSnapshot,
    String categorySnapshot,
    String difficultySnapshot,
    Boolean answered
) {}
