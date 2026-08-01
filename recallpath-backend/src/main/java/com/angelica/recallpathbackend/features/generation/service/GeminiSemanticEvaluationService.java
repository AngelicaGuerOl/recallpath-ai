package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.config.GeminiProperties;
import com.angelica.recallpathbackend.features.generation.exception.GenerationException;
import com.angelica.recallpathbackend.practice.dto.EvaluationResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.Models;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import com.google.genai.types.Type;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

public class GeminiSemanticEvaluationService implements SemanticEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiSemanticEvaluationService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GeminiProperties props;
    private final Models models;

    public GeminiSemanticEvaluationService(GeminiProperties props) {
        this.props = props;
        Client client = Client.builder()
                .apiKey(props.apiKey())
                .build();
        this.models = client.models;
    }

    // Constructor para tests
    GeminiSemanticEvaluationService(GeminiProperties props, Models models) {
        this.props = props;
        this.models = models;
    }

    @Override
    public EvaluationResponse evaluate(String term, String referenceDefinition, String studentAnswer) {
        String prompt = buildPrompt(term, referenceDefinition, studentAnswer);
        String rawJson = callGemini(prompt);
        return parseResponse(rawJson);
    }

    @Override
    public String getProviderName() {
        return "GEMINI";
    }

    @Override
    public String getModelName() {
        return props.model();
    }

    private String buildPrompt(String term, String referenceDefinition, String studentAnswer) {
        return String.format("""
                Evalúa la respuesta del estudiante comparándola semánticamente con la definición de referencia.

                Término:
                %s

                Definición de referencia:
                %s

                Respuesta del estudiante:
                %s

                Una respuesta es correcta cuando expresa la idea esencial de la definición, aunque utilice palabras diferentes.
                No exijas coincidencia literal. Acepta sinónimos, paráfrasis y explicaciones más breves. Ignora errores menores de ortografía o gramática.
                Una respuesta es incorrecta cuando confunde el concepto, contradice la referencia, omite por completo su idea principal o no responde la pregunta.
                No exijas detalles que no estén presentes en la definición de referencia.
                No marques como incorrecta una respuesta solo porque sea más corta.
                Devuelve exclusivamente el JSON estructurado solicitado.
                """, term, referenceDefinition, studentAnswer);
    }

    private Schema buildResponseSchema() {
        return Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "correct", Schema.builder().type(Type.Known.BOOLEAN).description("true si la respuesta es correcta, false si es incorrecta").build(),
                        "feedback", Schema.builder().type(Type.Known.STRING).description("Explicación breve, educativa y específica de por qué es correcta o incorrecta").build()
                ))
                .required(List.of("correct", "feedback"))
                .build();
    }

    private String callGemini(String prompt) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .responseSchema(buildResponseSchema())
                .maxOutputTokens(props.maxOutputTokens())
                .build();

        try {
            Content content = Content.fromParts(Part.fromText(prompt));
            GenerateContentResponse response = models.generateContent(
                    props.model(),
                    content,
                    config
            );

            if (response.candidates() == null || response.candidates().isEmpty()) {
                log.warn("[Gemini-Eval] La respuesta llegó vacía o bloqueada por seguridad.");
                throw new GenerationException(GenerationException.Cause.SAFETY_BLOCKED, "Respuesta bloqueada por filtros de seguridad");
            }

            String rawJson = response.text();
            if (rawJson == null || rawJson.isBlank()) {
                throw new GenerationException(GenerationException.Cause.EMPTY_RESPONSE, "Respuesta vacía de la IA.");
            }
            return rawJson;
        } catch (GenerationException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Gemini-Eval] Error en API: {}", e.getMessage(), e);
            throw new GenerationException(GenerationException.Cause.UNEXPECTED, "Error temporal al evaluar con IA");
        }
    }

    private EvaluationResponse parseResponse(String rawJson) {
        try {
            JsonNode root = MAPPER.readTree(rawJson);
            if (!root.has("correct") || !root.has("feedback")) {
                throw new GenerationException(GenerationException.Cause.INVALID_SCHEMA, "Formato JSON incorrecto devuelto por IA.");
            }
            boolean correct = root.get("correct").asBoolean();
            String feedback = root.get("feedback").asText();
            return new EvaluationResponse(correct, feedback);
        } catch (Exception e) {
            log.warn("[Gemini-Eval] No se pudo parsear el JSON de evaluación: {}", rawJson);
            throw new GenerationException(GenerationException.Cause.INVALID_JSON, "Error al interpretar la respuesta de la IA.");
        }
    }
}
