package com.angelica.recallpathbackend.features.generation.service;

import com.angelica.recallpathbackend.config.GeminiProperties;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationContext;
import com.angelica.recallpathbackend.features.generation.dto.FlashcardGenerationResult;
import com.angelica.recallpathbackend.features.generation.dto.GeneratedCardDto;
import com.angelica.recallpathbackend.features.generation.exception.GenerationException;
import com.angelica.recallpathbackend.flashcard.entity.FlashcardDifficulty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import com.google.genai.types.Type;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class GeminiFlashcardGenerationService implements FlashcardGenerationService {

    static final String PROMPT_VERSION = "v2-strict";
    private static final Logger log = LoggerFactory.getLogger(GeminiFlashcardGenerationService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GeminiProperties props;
    private final Client client;

    public GeminiFlashcardGenerationService(GeminiProperties props) {
        this.props = props;
        this.client = Client.builder()
                .apiKey(props.apiKey())
                .build();
    }

    GeminiFlashcardGenerationService(GeminiProperties props, Client client) {
        this.props = props;
        this.client = client;
    }

    @Override
    public FlashcardGenerationResult generate(FlashcardGenerationContext context) {
        String prompt = buildPrompt(context);
        String rawJson = callGemini(prompt);
        
        ValidationResult validation = parseAndValidate(rawJson, context);
        if (validation.invalidCards().isEmpty()) {
            return new FlashcardGenerationResult(validation.validCards(), rawJson, "GEMINI", props.model(), PROMPT_VERSION);
        }

        log.info("[Gemini] Fallaron {} tarjetas de runId {}. Iniciando llamada de reparación.", validation.invalidCards().size(), context.runId());
        
        String repairPrompt = buildRepairPrompt(validation.invalidCards(), context);
        String repairRawJson = callGemini(repairPrompt);
        
        ValidationResult repairValidation = parseAndValidate(repairRawJson, context);
        if (!repairValidation.invalidCards().isEmpty()) {
            log.error("[Gemini] Reparación falló para runId {}. Abortando.", context.runId());
            throw new GenerationException(GenerationException.Cause.INVALID_SCHEMA, "La IA alucinó evidencia incluso tras intento de reparación.");
        }
        
        List<GeneratedCardDto> finalCards = new ArrayList<>(validation.validCards());
        finalCards.addAll(repairValidation.validCards());
        
        return new FlashcardGenerationResult(finalCards, rawJson + "\n\n---REPAIR---\n\n" + repairRawJson, "GEMINI", props.model(), PROMPT_VERSION);
    }

    private String callGemini(String prompt) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .responseSchema(buildResponseSchema())
                .maxOutputTokens(props.maxOutputTokens())
                .build();

        try {
            Content content = Content.fromParts(Part.fromText(prompt));
            GenerateContentResponse response = client.models.generateContent(
                    props.model(),
                    content,
                    config
            );

            if (response.candidates() == null || response.candidates().isEmpty()) {
                log.warn("[Gemini] La respuesta llegó vacía o fue bloqueada por filtros de seguridad.");
                throw new GenerationException(GenerationException.Cause.SAFETY_BLOCKED,
                        "La respuesta fue bloqueada por filtros de seguridad de la IA.");
            }

            String rawJson = response.text();
            if (rawJson == null || rawJson.isBlank()) {
                throw new GenerationException(GenerationException.Cause.EMPTY_RESPONSE,
                        "La IA devolvió una respuesta vacía.");
            }
            return rawJson;
        } catch (GenerationException e) {
            throw e;
        } catch (Exception e) {
            throw translateException(e);
        }
    }

    String buildPrompt(FlashcardGenerationContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("""
                Eres un asistente especializado en crear tarjetas de estudio (flashcards) a partir de texto de documentos académicos o técnicos.
                
                INSTRUCCIONES:
                - Utiliza ÚNICAMENTE la información presente en el CONTENIDO DEL DOCUMENTO proporcionado.
                - Genera exactamente %d tarjetas (o menos si no hay suficiente información).
                - Idioma: %s
                - Dificultad: %s
                - Tipos: %s
                - El sourceExcerpt debe copiarse de manera literal del texto de la sourcePage correspondiente.
                - Debe ser un fragmento continuo.
                - Debe tener entre 8 y 30 palabras.
                - No uses paráfrasis, traducción, corrección ni puntos suspensivos.
                - Si no encuentras evidencia suficiente en el texto para generar una tarjeta, omítela.
                - La fuente debe tomarse exclusivamente del texto bajo el marcador === PAGE N === correspondiente a sourcePage.
                - difficulty debe ser EASY, MEDIUM o HARD.
                
                ================== INICIO DEL CONTENIDO DEL DOCUMENTO ==================
                """,
                context.requestedCardCount(),
                context.language(),
                context.difficulty(),
                String.join(", ", context.contentTypes())
        ));

        for (int i = context.pageFrom(); i <= context.pageTo(); i++) {
            String txt = context.pageTexts().get(i);
            if (txt != null) {
                sb.append("=== PAGE ").append(i).append(" ===\n").append(txt).append("\n\n");
            }
        }
        sb.append("================== FIN DEL CONTENIDO DEL DOCUMENTO ==================\n");
        return sb.toString();
    }

    String buildRepairPrompt(List<InvalidCard> invalidCards, FlashcardGenerationContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Las siguientes tarjetas generadas previamente fallaron porque el 'sourceExcerpt' no se encontró de forma literal en la 'sourcePage' indicada. Corrige 'sourceExcerpt' (y 'sourcePage' si es necesario) usando EXACTAMENTE el texto del documento para esa página.\n\n");
        
        Set<Integer> pagesNeeded = new HashSet<>();
        
        sb.append("--- Tarjetas a reparar ---\n");
        for (InvalidCard ic : invalidCards) {
            sb.append(ic.node().toString()).append("\n");
            sb.append("Error: ").append(ic.reason()).append("\n\n");
            if (ic.attemptedSourcePage() >= context.pageFrom() && ic.attemptedSourcePage() <= context.pageTo()) {
                pagesNeeded.add(ic.attemptedSourcePage());
            }
        }
        
        sb.append("--- Texto de las páginas relevantes ---\n");
        for (Integer p : pagesNeeded) {
            String txt = context.pageTexts().get(p);
            if (txt != null) {
                sb.append("=== PAGE ").append(p).append(" ===\n").append(txt).append("\n\n");
            }
        }
        
        sb.append("--- Texto completo del rango (por si la evidencia está en otra página) ---\n");
        for (int i = context.pageFrom(); i <= context.pageTo(); i++) {
            if (!pagesNeeded.contains(i)) {
                String txt = context.pageTexts().get(i);
                if (txt != null) {
                    sb.append("=== PAGE ").append(i).append(" ===\n").append(txt).append("\n\n");
                }
            }
        }
        
        return sb.toString();
    }

    private Schema buildResponseSchema() {
        Schema cardSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(java.util.Map.of(
                        "term",         Schema.builder().type(Type.Known.STRING).description("Término o concepto clave").build(),
                        "definition",   Schema.builder().type(Type.Known.STRING).description("Definición o explicación concisa").build(),
                        "category",     Schema.builder().type(Type.Known.STRING).description("Categoría opcional, null si no aplica").nullable(true).build(),
                        "difficulty",   Schema.builder().type(Type.Known.STRING).description("Dificultad: EASY, MEDIUM o HARD").build(),
                        "sourcePage",   Schema.builder().type(Type.Known.INTEGER).description("Número de página del documento de donde proviene").build(),
                        "sourceExcerpt",Schema.builder().type(Type.Known.STRING).description("Fragmento literal o fiel del texto fuente").build()
                ))
                .required(List.of("term", "definition", "difficulty", "sourcePage", "sourceExcerpt"))
                .build();

        return Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(java.util.Map.of(
                        "cards", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(cardSchema)
                                .description("Lista de flashcards generadas")
                                .build()
                ))
                .required(List.of("cards"))
                .build();
    }

    record InvalidCard(JsonNode node, String reason, int attemptedSourcePage) {}
    record ValidationResult(List<GeneratedCardDto> validCards, List<InvalidCard> invalidCards) {}

    ValidationResult parseAndValidate(String rawJson, FlashcardGenerationContext context) {
        JsonNode root;
        try {
            root = MAPPER.readTree(rawJson);
        } catch (Exception e) {
            log.warn("[Gemini] No se pudo parsear el JSON de respuesta");
            throw new GenerationException(GenerationException.Cause.INVALID_JSON,
                    "La IA devolvió una respuesta que no pudo validarse. Intenta nuevamente.");
        }

        JsonNode cardsNode = root.path("cards");
        if (cardsNode.isMissingNode() || !cardsNode.isArray()) {
            throw new GenerationException(GenerationException.Cause.INVALID_SCHEMA,
                    "La IA devolvió una respuesta que no pudo validarse. Intenta nuevamente.");
        }

        List<GeneratedCardDto> validCards = new ArrayList<>();
        List<InvalidCard> invalidCards = new ArrayList<>();
        Set<String> seenNormalized = new HashSet<>();

        int index = 0;
        for (JsonNode cardNode : cardsNode) {
            index++;
            try {
                GeneratedCardDto card = parseCard(cardNode, context, index);
                
                String normalized = TextNormalizer.normalize(card.term());
                if (seenNormalized.contains(normalized)) {
                    log.debug("[Gemini] Tarjeta duplicada eliminada: '{}'", card.term());
                    continue;
                }
                seenNormalized.add(normalized);
                validCards.add(card);
            } catch (CardValidationException e) {
                invalidCards.add(new InvalidCard(cardNode, e.getMessage(), e.attemptedSourcePage()));
            }
        }

        if (validCards.isEmpty() && invalidCards.isEmpty()) {
            throw new GenerationException(GenerationException.Cause.EMPTY_RESPONSE,
                    "La IA devolvió una respuesta que no pudo validarse. Intenta nuevamente.");
        }

        return new ValidationResult(validCards, invalidCards);
    }

    private static class CardValidationException extends Exception {
        private final int attemptedSourcePage;
        public CardValidationException(String message, int attemptedSourcePage) {
            super(message);
            this.attemptedSourcePage = attemptedSourcePage;
        }
        public int attemptedSourcePage() { return attemptedSourcePage; }
    }

    private GeneratedCardDto parseCard(JsonNode node, FlashcardGenerationContext context, int index) throws CardValidationException {
        try {
            String term = trimRequired(node, "term");
            String definition = trimRequired(node, "definition");
            String sourceExcerpt = trimRequired(node, "sourceExcerpt");
            String diffStr = trimRequired(node, "difficulty");
            int sourcePage = node.path("sourcePage").asInt(-1);

            if (term == null || definition == null || sourceExcerpt == null || diffStr == null) {
                throw new CardValidationException("Campos obligatorios faltantes", sourcePage);
            }

            FlashcardDifficulty difficulty;
            try {
                difficulty = FlashcardDifficulty.valueOf(diffStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new CardValidationException("Dificultad inválida", sourcePage);
            }

            if (sourcePage < context.pageFrom() || sourcePage > context.pageTo()) {
                throw new CardValidationException("Página fuera de rango", sourcePage);
            }

            String pageText = context.pageTexts().get(sourcePage);
            if (pageText == null) {
                throw new CardValidationException("Página sin texto extraíble", sourcePage);
            }

            String normExcerpt = TextNormalizer.normalize(sourceExcerpt);
            String normPageText = TextNormalizer.normalize(pageText);

            if (!normPageText.contains(normExcerpt)) {
                log.warn("[Gemini] sourceExcerpt no encontrado en la sourcePage {}. Alucinación.", sourcePage);
                throw new CardValidationException("sourceExcerpt no encontrado en el texto original", sourcePage);
            }

            String category = null;
            JsonNode catNode = node.path("category");
            if (!catNode.isNull() && !catNode.isMissingNode()) {
                String raw = catNode.asText("").trim();
                if (!raw.isEmpty()) category = raw;
            }

            String sanitizedExcerpt = sourceExcerpt.substring(0, Math.min(30, sourceExcerpt.length())).replace('\n', ' ');
            log.info("[Gemini] (runId={}) Validada tarjeta {}: sourcePage={}, excerptLen={}, sample='{}...'",
                    context.runId(), index, sourcePage, sourceExcerpt.length(), sanitizedExcerpt);

            return new GeneratedCardDto(term, definition, sourceExcerpt, sourcePage, category, difficulty);
        } catch (CardValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new CardValidationException("Error inesperado leyendo la tarjeta", -1);
        }
    }

    private String trimRequired(JsonNode node, String field) {
        JsonNode n = node.path(field);
        if (n.isNull() || n.isMissingNode()) return null;
        String v = n.asText("").trim();
        return v.isEmpty() ? null : v;
    }

    private GenerationException translateException(Exception e) {
        String msg = e.getMessage() == null ? "" : e.getMessage().toLowerCase();

        if (msg.contains("api_key") || msg.contains("api key") ||
                msg.contains("unauthorized") || msg.contains("authentication") || msg.contains("invalid_api_key")) {
            log.error("[Gemini] Error de autenticación con la API de IA", e);
            return new GenerationException(GenerationException.Cause.AUTH_ERROR,
                    "La generación con IA no está configurada.");
        }

        if (msg.contains("quota") || msg.contains("rate_limit") || msg.contains("resource_exhausted") ||
                msg.contains("429") || msg.contains("too many requests")) {
            log.warn("[Gemini] Cuota o rate limit alcanzado", e);
            return new GenerationException(GenerationException.Cause.QUOTA_EXCEEDED,
                    "El servicio de IA alcanzó temporalmente su límite. Intenta más tarde.");
        }

        if (msg.contains("timeout") || msg.contains("timed out") ||
                msg.contains("connection") || msg.contains("socket")) {
            log.warn("[Gemini] Timeout o error de conexión con el servicio de IA", e);
            return new GenerationException(GenerationException.Cause.TIMEOUT,
                    "La generación tardó demasiado. Intenta con menos páginas o menos tarjetas.");
        }

        log.error("[Gemini] Error inesperado al llamar a la API de IA: {}", e.getClass().getSimpleName(), e);
        return new GenerationException(GenerationException.Cause.UNEXPECTED,
                "No fue posible generar las tarjetas.");
    }
}
