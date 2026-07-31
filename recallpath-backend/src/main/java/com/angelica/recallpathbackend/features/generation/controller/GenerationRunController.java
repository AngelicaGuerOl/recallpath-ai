package com.angelica.recallpathbackend.features.generation.controller;

import com.angelica.recallpathbackend.features.generation.dto.GenerationRunRequest;
import com.angelica.recallpathbackend.features.generation.dto.GenerationRunResponse;
import com.angelica.recallpathbackend.features.generation.entity.GenerationRun;
import com.angelica.recallpathbackend.features.generation.service.GenerationRunService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class GenerationRunController {

    private final GenerationRunService generationRunService;
    private final com.angelica.recallpathbackend.flashcard.service.FlashcardService flashcardService;

    public GenerationRunController(GenerationRunService generationRunService, com.angelica.recallpathbackend.flashcard.service.FlashcardService flashcardService) {
        this.generationRunService = generationRunService;
        this.flashcardService = flashcardService;
    }

    @PostMapping("/documents/{documentId}/generation-runs")
    @ResponseStatus(HttpStatus.CREATED)
    public GenerationRunResponse createGenerationRun(
            @PathVariable Long documentId,
            @Valid @RequestBody GenerationRunRequest request
    ) {
        GenerationRun run = generationRunService.createGenerationRun(documentId, request);
        return mapToResponse(run);
    }

    @GetMapping("/generation-runs/{runId}")
    public GenerationRunResponse getGenerationRun(@PathVariable Long runId) {
        GenerationRun run = generationRunService.getGenerationRun(runId);
        return mapToResponse(run);
    }

    @GetMapping("/generation-runs/{runId}/flashcards")
    public java.util.List<com.angelica.recallpathbackend.flashcard.dto.FlashcardResponse> getGeneratedFlashcards(@PathVariable Long runId) {
        return flashcardService.findGeneratedFlashcardsByRun(runId);
    }

    private GenerationRunResponse mapToResponse(GenerationRun run) {
        return new GenerationRunResponse(
                run.getId(),
                run.getDocument().getId(),
                run.getDeck().getId(),
                run.getStatus(),
                run.getSelectedPageFrom(),
                run.getSelectedPageTo(),
                run.getRequestedCardCount(),
                run.getLanguage(),
                run.getDifficulty(),
                run.getErrorMessage(),
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getCreatedAt()
        );
    }
}
