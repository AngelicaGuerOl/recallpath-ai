package com.angelica.recallpathbackend.flashcard.controller;

import com.angelica.recallpathbackend.flashcard.dto.CreateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.dto.FlashcardResponse;
import com.angelica.recallpathbackend.flashcard.dto.UpdateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.service.FlashcardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/decks/{deckId}/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }

    @GetMapping
    public ResponseEntity<List<FlashcardResponse>> findFlashcards(@PathVariable Long deckId) {
        return ResponseEntity.ok(flashcardService.findFlashcards(deckId));
    }

    @PostMapping
    public ResponseEntity<FlashcardResponse> createFlashcard(
            @PathVariable Long deckId,
            @Valid @RequestBody CreateFlashcardRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardService.createFlashcard(deckId, request));
    }

    @PutMapping("/{cardId}")
    public ResponseEntity<FlashcardResponse> updateFlashcard(
            @PathVariable Long deckId,
            @PathVariable Long cardId,
            @Valid @RequestBody UpdateFlashcardRequest request
    ) {
        return ResponseEntity.ok(flashcardService.updateFlashcard(deckId, cardId, request));
    }

    @PatchMapping("/{cardId}/archive")
    public ResponseEntity<FlashcardResponse> archiveFlashcard(
            @PathVariable Long deckId,
            @PathVariable Long cardId
    ) {
        return ResponseEntity.ok(flashcardService.archiveFlashcard(deckId, cardId));
    }

    @PatchMapping("/{cardId}/restore")
    public ResponseEntity<FlashcardResponse> restoreFlashcard(
            @PathVariable Long deckId,
            @PathVariable Long cardId
    ) {
        return ResponseEntity.ok(flashcardService.restoreFlashcard(deckId, cardId));
    }
}
