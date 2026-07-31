package com.angelica.recallpathbackend.document.dto;

public record DocumentPageDto(
    Long id,
    Integer pageNumber,
    String extractedText,
    Integer characterCount
) {}
