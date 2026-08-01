package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.practice.dto.EvaluationResponse;

public class FakeSemanticEvaluationService implements SemanticEvaluationService {

    @Override
    public EvaluationResponse evaluate(String term, String referenceDefinition, String studentAnswer) {
        // En modo FAKE, simplemente validamos que la respuesta contenga al menos una palabra de más de 3 letras.
        // Esto es solo para pruebas sin consumir API.
        boolean isCorrect = studentAnswer != null && studentAnswer.length() > 5;
        String feedback = isCorrect 
            ? "¡Muy bien! (Evaluación simulada en modo FAKE)" 
            : "Te faltó detalle. (Evaluación simulada en modo FAKE)";
        return new EvaluationResponse(isCorrect, feedback);
    }

    @Override
    public String getProviderName() {
        return "FAKE";
    }

    @Override
    public String getModelName() {
        return "fake-semantic-evaluator";
    }
}
