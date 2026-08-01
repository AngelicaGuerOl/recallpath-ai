package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.config.GeminiProperties;
import com.angelica.recallpathbackend.features.generation.exception.GenerationException;
import com.angelica.recallpathbackend.practice.dto.EvaluationResponse;
import com.google.genai.Client;
import com.google.genai.Models;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Candidate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GeminiSemanticEvaluationServiceTest {

    private GeminiProperties props;
    private Models mockModels;
    private GeminiSemanticEvaluationService service;

    @BeforeEach
    void setUp() {
        props = new GeminiProperties("fake-key", "gemini-2.5-flash", 30, 8192);
        mockModels = mock(Models.class);
        
        service = new GeminiSemanticEvaluationService(props, mockModels);
    }

    @Test
    void testEvaluate_SuccessCorrect() throws Exception {
        GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
        Candidate candidate = mock(Candidate.class);
        
        when(mockResponse.candidates()).thenReturn(Optional.of(List.of(candidate)));
        String validJson = "{\"correct\":true,\"feedback\":\"Perfecto!\"}";
        when(mockResponse.text()).thenReturn(validJson);
        when(mockModels.generateContent(eq("gemini-2.5-flash"), any(Content.class), any(GenerateContentConfig.class)))
                .thenReturn(mockResponse);

        EvaluationResponse eval = service.evaluate("CPU", "Unidad de procesamiento", "Unidad central");
        
        assertTrue(eval.correct());
        assertEquals("Perfecto!", eval.feedback());
    }

    @Test
    void testEvaluate_SuccessIncorrect() throws Exception {
        GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
        Candidate candidate = mock(Candidate.class);
        
        when(mockResponse.candidates()).thenReturn(Optional.of(List.of(candidate)));
        String validJson = "{\"correct\":false,\"feedback\":\"Te equivocaste de concepto\"}";
        when(mockResponse.text()).thenReturn(validJson);
        when(mockModels.generateContent(eq("gemini-2.5-flash"), any(Content.class), any(GenerateContentConfig.class)))
                .thenReturn(mockResponse);

        EvaluationResponse eval = service.evaluate("CPU", "Unidad de procesamiento", "Memoria RAM");
        
        assertFalse(eval.correct());
        assertEquals("Te equivocaste de concepto", eval.feedback());
    }

    @Test
    void testEvaluate_EmptyResponseThrowsException() throws Exception {
        GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
        Candidate candidate = mock(Candidate.class);
        
        when(mockResponse.candidates()).thenReturn(Optional.of(List.of(candidate)));
        when(mockResponse.text()).thenReturn(" ");
        when(mockModels.generateContent(eq("gemini-2.5-flash"), any(Content.class), any(GenerateContentConfig.class)))
                .thenReturn(mockResponse);

        GenerationException ex = assertThrows(GenerationException.class, () -> 
                service.evaluate("CPU", "Def", "Ans"));
        
        assertEquals(GenerationException.Cause.EMPTY_RESPONSE, ex.getGenerationCause());
    }

    @Test
    void testEvaluate_InvalidJsonThrowsException() throws Exception {
        GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
        Candidate candidate = mock(Candidate.class);
        
        when(mockResponse.candidates()).thenReturn(Optional.of(List.of(candidate)));
        when(mockResponse.text()).thenReturn("invalid json");
        when(mockModels.generateContent(eq("gemini-2.5-flash"), any(Content.class), any(GenerateContentConfig.class)))
                .thenReturn(mockResponse);

        GenerationException ex = assertThrows(GenerationException.class, () -> 
                service.evaluate("CPU", "Def", "Ans"));
        
        assertEquals(GenerationException.Cause.INVALID_JSON, ex.getGenerationCause());
    }

    @Test
    void testEvaluate_EmptyCandidatesThrowsException() throws Exception {
        GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
        
        when(mockResponse.candidates()).thenReturn(Optional.empty());
        when(mockModels.generateContent(eq("gemini-2.5-flash"), any(Content.class), any(GenerateContentConfig.class)))
                .thenReturn(mockResponse);

        GenerationException ex = assertThrows(GenerationException.class, () -> 
                service.evaluate("CPU", "Def", "Ans"));
        
        assertEquals(GenerationException.Cause.SAFETY_BLOCKED, ex.getGenerationCause());
    }
}
