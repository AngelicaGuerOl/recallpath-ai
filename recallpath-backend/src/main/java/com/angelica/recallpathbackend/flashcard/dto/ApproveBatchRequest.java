package com.angelica.recallpathbackend.flashcard.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ApproveBatchRequest(
        @NotEmpty
        List<Long> flashcardIds
) {}
