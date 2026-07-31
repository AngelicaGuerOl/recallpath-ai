package com.angelica.recallpathbackend.flashcard.service;

import com.angelica.recallpathbackend.flashcard.dto.ApproveBatchRequest;
import com.angelica.recallpathbackend.flashcard.dto.CreateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.dto.FlashcardResponse;
import com.angelica.recallpathbackend.flashcard.dto.UpdateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardStatus;
import java.util.List;

public interface FlashcardService {

    List<FlashcardResponse> findFlashcards(Long deckId);

    List<FlashcardResponse> findFlashcardsByStatus(Long deckId, FlashcardStatus status);

    List<FlashcardResponse> findGeneratedFlashcardsByRun(Long runId);

    FlashcardResponse createFlashcard(Long deckId, CreateFlashcardRequest request);

    FlashcardResponse updateFlashcard(Long deckId, Long cardId, UpdateFlashcardRequest request);

    FlashcardResponse archiveFlashcard(Long deckId, Long cardId);

    FlashcardResponse restoreFlashcard(Long deckId, Long cardId);

    FlashcardResponse approveFlashcard(Long deckId, Long cardId);

    FlashcardResponse rejectFlashcard(Long deckId, Long cardId);

    void approveBatch(Long deckId, ApproveBatchRequest request);
}
