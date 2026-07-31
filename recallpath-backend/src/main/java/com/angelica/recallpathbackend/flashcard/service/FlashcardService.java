package com.angelica.recallpathbackend.flashcard.service;

import com.angelica.recallpathbackend.flashcard.dto.CreateFlashcardRequest;
import com.angelica.recallpathbackend.flashcard.dto.FlashcardResponse;
import com.angelica.recallpathbackend.flashcard.dto.UpdateFlashcardRequest;
import java.util.List;

public interface FlashcardService {

    List<FlashcardResponse> findFlashcards(Long deckId);

    FlashcardResponse createFlashcard(Long deckId, CreateFlashcardRequest request);

    FlashcardResponse updateFlashcard(Long deckId, Long cardId, UpdateFlashcardRequest request);

    FlashcardResponse archiveFlashcard(Long deckId, Long cardId);

    FlashcardResponse restoreFlashcard(Long deckId, Long cardId);
}
