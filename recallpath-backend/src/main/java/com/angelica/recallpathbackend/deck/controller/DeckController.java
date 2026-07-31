package com.angelica.recallpathbackend.deck.controller;

import com.angelica.recallpathbackend.deck.dto.CreateDeckRequest;
import com.angelica.recallpathbackend.deck.dto.DeckPageResponse;
import com.angelica.recallpathbackend.deck.dto.DeckResponse;
import com.angelica.recallpathbackend.deck.dto.UpdateDeckRequest;
import com.angelica.recallpathbackend.deck.service.DeckService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/decks")
public class DeckController {

    private final DeckService deckService;

    public DeckController(DeckService deckService) {
        this.deckService = deckService;
    }

    @GetMapping
    public ResponseEntity<DeckPageResponse> findDecks(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean archived
    ) {
        return ResponseEntity.ok(deckService.findDecks(page, size, search, archived));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponse> getDeck(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.getDeck(id));
    }

    @PostMapping
    public ResponseEntity<DeckResponse> createDeck(@Valid @RequestBody CreateDeckRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.createDeck(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeckResponse> updateDeck(@PathVariable Long id, @Valid @RequestBody UpdateDeckRequest request) {
        return ResponseEntity.ok(deckService.updateDeck(id, request));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<DeckResponse> archiveDeck(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.archiveDeck(id));
    }

    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<DeckResponse> unarchiveDeck(@PathVariable Long id) {
        return ResponseEntity.ok(deckService.unarchiveDeck(id));
    }
}
