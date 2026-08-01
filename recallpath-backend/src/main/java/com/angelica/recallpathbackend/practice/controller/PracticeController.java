package com.angelica.recallpathbackend.practice.controller;

import com.angelica.recallpathbackend.practice.dto.PracticeAttemptRequest;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSummaryResponse;
import com.angelica.recallpathbackend.practice.entity.PracticeMode;
import com.angelica.recallpathbackend.practice.service.PracticeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    /**
     * Inicia o reanuda una sesión de práctica.
     *
     * @param deckId          ID del deck.
     * @param mode            Modo de práctica (FLASHCARDS, MULTIPLE_CHOICE).
     * @param incorrectOnly   Si {@code true}, solo incluye las tarjetas respondidas
     *                        incorrectamente en la sesión indicada por {@code sourceSessionId}.
     * @param sourceSessionId Sesión de práctica previa (requerido con {@code incorrectOnly=true}).
     */
    @PostMapping("/decks/{deckId}/practice-sessions")
    public ResponseEntity<PracticeSessionResponse> startOrResumeSession(
            @PathVariable Long deckId,
            @RequestParam(defaultValue = "FLASHCARDS") PracticeMode mode,
            @RequestParam(required = false) Boolean incorrectOnly,
            @RequestParam(required = false) Long sourceSessionId) {
        PracticeSessionResponse response = practiceService.startOrResumeSession(
                deckId, mode, incorrectOnly, sourceSessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/practice-sessions/{sessionId}")
    public ResponseEntity<PracticeSessionResponse> getSession(@PathVariable Long sessionId) {
        PracticeSessionResponse response = practiceService.getSession(sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/practice-sessions/{sessionId}/cards/{sessionCardId}/result")
    public ResponseEntity<PracticeSessionResponse> submitCardResult(
            @PathVariable Long sessionId,
            @PathVariable Long sessionCardId,
            @RequestBody PracticeAttemptRequest request) {
        PracticeSessionResponse response = practiceService.submitCardResult(sessionId, sessionCardId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/practice-sessions/{sessionId}/cancel")
    public ResponseEntity<Void> cancelSession(@PathVariable Long sessionId) {
        practiceService.cancelSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/practice-sessions/{sessionId}/summary")
    public ResponseEntity<PracticeSummaryResponse> getSessionSummary(@PathVariable Long sessionId) {
        PracticeSummaryResponse summary = practiceService.getSessionSummary(sessionId);
        return ResponseEntity.ok(summary);
    }
}
