# AI Integration

RecallPath AI uses Google Gemini as its primary AI provider. The integration is designed to be secure, reliable, and easily testable.

## Environment Variables

The AI integration is configured using the following environment variables (defined in `.env`):

- `AI_PROVIDER`: Determines which provider implementation to use. Supported values are `gemini` (real API) and `fake` (for development/testing).
- `GEMINI_API_KEY`: Your Google Gemini API key. **Never commit this to version control.**
- `GEMINI_MODEL`: The specific Gemini model to use (default: `gemini-3.5-flash-lite`).
- `GEMINI_TIMEOUT_SECONDS`: Configuration timeout parameter.
- `GEMINI_MAX_OUTPUT_TOKENS`: Maximum length of the generated response.

## 1. Flashcard Generation

The primary AI feature is generating flashcards from extracted PDF text.

### Structured Output Schema
The Gemini API is called using its "Structured Output" (JSON Schema) feature to return an object containing an array of cards:

```json
{
  "cards": [
    {
      "term": "Example",
      "definition": "Example definition",
      "category": "Optional category",
      "difficulty": "EASY",
      "sourcePage": 1,
      "sourceExcerpt": "Literal excerpt from the selected page"
    }
  ]
}
```

### Process and Validation Rules

1. **Request**: The system requests the structured output above.
2. **JSON Validation**: The backend parses the JSON response using Jackson. If unparseable, an exception is thrown.
3. **Field Validation**: The system validates all required fields are present and that the `difficulty` matches the requested enum.
4. **Evidence Validation**: 
   - Verifies that `sourcePage` is within the range of the originally requested pages.
   - Normalizes text and strictly verifies that the `sourceExcerpt` literally exists in the extracted text of the indicated page.
5. **Deduplication**: Removes duplicate concepts within the AI's response to ensure clean decks.
6. **Repair Call**: If cards fail evidence validation, the system performs a second repair call to Gemini to correct the invalid evidence. If the repair also fails to produce valid evidence, the generation run is failed.
7. **Execution**: The call to Gemini executes **outside of a database transaction**.
8. **Persistence**: The results (cards, run status) are persisted atomically in a short transaction. The `provider`, `model`, `prompt version`, and (when applicable/configured) the `raw response` are stored in the database for auditing.

## 2. Semantic Evaluation of Written Answers

The second AI feature evaluates user-submitted written answers during practice.

### Process
1. **Context**: The AI is provided with the term, the reference definition, and the user answer.
2. **Evaluation**: The AI performs a semantic evaluation. It is instructed to accept synonyms and paraphrasing, focusing on whether the core meaning matches the reference definition.
3. **Structured Response**: The AI returns a boolean `correct` flag and a string `feedback`.
4. **Persistence**: The `correct` status, the AI `feedback`, and the auditing details (`provider`, `model`) are immediately persisted in the `PracticeAttempt`.

## Provider Selection & Fake Provider

When `AI_PROVIDER=fake`, the backend injects mock implementations that simulate AI responses instantaneously. When `AI_PROVIDER=gemini`, the real implementations are used.

## Prompt Structure

The semantic-evaluation prompt separates the term, reference definition,
and student answer into labeled sections. This improves prompt clarity but
does not provide complete protection against adversarial prompt injection.

## Error Handling

Errors from the AI provider are handled by throwing a `GenerationException` with specific causes, which the global exception handler translates into appropriate HTTP status codes:
- **AUTH_ERROR**: 500 Internal Server Error
- **UNEXPECTED**: 500 Internal Server Error
- **QUOTA_EXCEEDED**: 503 Service Unavailable
- **TIMEOUT**: 503 Service Unavailable
- **SAFETY_BLOCKED**: 422 Unprocessable Entity
- **EMPTY_RESPONSE**: 502 Bad Gateway
- **INVALID_JSON**: 502 Bad Gateway
- **INVALID_SCHEMA**: 502 Bad Gateway

A failed evidence-repair attempt becomes `INVALID_SCHEMA` and therefore returns `502 Bad Gateway`.
