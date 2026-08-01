package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.practice.dto.EvaluationResponse;

public interface SemanticEvaluationService {
    
    /**
     * Evaluates a student's answer against a reference definition using semantic AI.
     *
     * @param term The term or concept being evaluated.
     * @param referenceDefinition The correct, reference definition from the flashcard.
     * @param studentAnswer The answer provided by the student.
     * @return EvaluationResponse containing whether the answer is correct and a short feedback message.
     */
    EvaluationResponse evaluate(String term, String referenceDefinition, String studentAnswer);
    
    /**
     * @return The identifier of the AI provider.
     */
    String getProviderName();

    /**
     * @return The model used for evaluation.
     */
    String getModelName();
}
