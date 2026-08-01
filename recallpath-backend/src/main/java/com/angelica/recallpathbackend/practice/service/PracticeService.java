package com.angelica.recallpathbackend.practice.service;

import com.angelica.recallpathbackend.practice.dto.PracticeAttemptRequest;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSummaryResponse;
import com.angelica.recallpathbackend.practice.entity.PracticeMode;

public interface PracticeService {
    /**
     * Inicia o reanuda una sesión de práctica.
     *
     * @param deckId          ID del deck.
     * @param mode            Modo de práctica.
     * @param incorrectOnly   Si {@code true}, la sesión incluye solo las tarjetas
     *                        respondidas incorrectamente en la sesión origen.
     * @param sourceSessionId ID de la sesión de práctica previa (requerido cuando
     *                        {@code incorrectOnly=true}).
     */
    PracticeSessionResponse startOrResumeSession(
            Long deckId,
            PracticeMode mode,
            Boolean incorrectOnly,
            Long sourceSessionId);

    PracticeSessionResponse getSession(Long sessionId);
    PracticeSessionResponse submitCardResult(Long sessionId, Long sessionCardId, PracticeAttemptRequest request);
    void cancelSession(Long sessionId);
    PracticeSummaryResponse getSessionSummary(Long sessionId);
}
