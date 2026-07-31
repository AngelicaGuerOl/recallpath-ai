package com.angelica.recallpathbackend.document.dto;

import java.util.List;

public record DocumentPageListDto(
    List<DocumentPageDto> pages,
    Integer totalPages
) {}
