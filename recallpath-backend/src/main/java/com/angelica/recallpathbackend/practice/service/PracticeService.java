package com.angelica.recallpathbackend.practice.service;

import com.angelica.recallpathbackend.practice.dto.PracticeAttemptRequest;
import com.angelica.recallpathbackend.practice.dto.PracticeSessionResponse;
import com.angelica.recallpathbackend.practice.dto.PracticeSummaryResponse;
import com.angelica.recallpathbackend.practice.entity.PracticeMode;

public interface PracticeService {
    PracticeSessionResponse startOrResumeSession(Long deckId, PracticeMode mode);
    PracticeSessionResponse getSession(Long sessionId);
    PracticeSessionResponse submitCardResult(Long sessionId, Long sessionCardId, PracticeAttemptRequest request);
    void cancelSession(Long sessionId);
    PracticeSummaryResponse getSessionSummary(Long sessionId);
}
