package com.angelica.recallpathbackend.document.dto;

import java.time.LocalDateTime;

public record DocumentDto(
    Long id,
    String originalFileName,
    String contentType,
    Long fileSize,
    Integer pageCount,
    String status,
    String errorMessage,
    LocalDateTime createdAt
) {}
