package com.angelica.recallpathbackend.deck.dto;

import java.util.List;

public record DeckPageResponse(
        List<DeckResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
