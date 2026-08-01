# API Overview

This document provides a summary of the REST API exposed by the RecallPath AI Spring Boot backend. The base path for all endpoints is `/api`.

## Decks
`DeckController`

| Method | Path | Purpose | Path Params | Query Params | Request Body | Response Type | Success Status | Errors |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/decks` | List decks | - | `page`, `size`, `search`, `archived` | - | `DeckPageResponse` | 200 OK | 400 |
| `GET` | `/api/decks/{id}` | Get deck details | `id` | - | - | `DeckResponse` | 200 OK | 404 |
| `POST` | `/api/decks` | Create a new deck | - | - | `CreateDeckRequest` | `DeckResponse` | 201 Created | 400 |
| `PUT` | `/api/decks/{id}` | Update deck | `id` | - | `UpdateDeckRequest` | `DeckResponse` | 200 OK | 400, 404 |
| `PATCH` | `/api/decks/{id}/archive` | Archive deck | `id` | - | - | `DeckResponse` | 200 OK | 404, 409 |
| `PATCH` | `/api/decks/{id}/unarchive` | Unarchive deck | `id` | - | - | `DeckResponse` | 200 OK | 404, 409 |

## Flashcards
`FlashcardController`

| Method | Path | Purpose | Path Params | Query Params | Request Body | Response Type | Success Status | Errors |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/decks/{deckId}/flashcards` | List flashcards | `deckId` | `status` | - | `List<FlashcardResponse>` | 200 OK | 404 |
| `POST` | `/api/decks/{deckId}/flashcards` | Create manual flashcard | `deckId` | - | `CreateFlashcardRequest` | `FlashcardResponse` | 201 Created | 400, 404 |
| `PUT` | `/api/decks/{deckId}/flashcards/{cardId}` | Update flashcard | `deckId`, `cardId` | - | `UpdateFlashcardRequest` | `FlashcardResponse` | 200 OK | 400, 404 |
| `PATCH` | `/api/decks/{deckId}/flashcards/{cardId}/archive` | Archive flashcard | `deckId`, `cardId` | - | - | `FlashcardResponse` | 200 OK | 404, 409 |
| `PATCH` | `/api/decks/{deckId}/flashcards/{cardId}/restore` | Restore flashcard | `deckId`, `cardId` | - | - | `FlashcardResponse` | 200 OK | 404, 409 |
| `PATCH` | `/api/decks/{deckId}/flashcards/{cardId}/approve` | Approve AI card | `deckId`, `cardId` | - | - | `FlashcardResponse` | 200 OK | 404, 409 |
| `PATCH` | `/api/decks/{deckId}/flashcards/{cardId}/reject` | Reject AI card | `deckId`, `cardId` | - | - | `FlashcardResponse` | 200 OK | 404, 409 |
| `POST` | `/api/decks/{deckId}/flashcards/approve-batch` | Approve multiple cards | `deckId` | - | `ApproveBatchRequest` | - | 200 OK | 400, 404 |

## Documents and Pages
`DocumentController`

| Method | Path | Purpose | Path Params | Query Params | Request Body | Response Type | Success Status | Errors |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/documents` | List documents | - | `search`, `status` | - | `List<DocumentDto>` | 200 OK | - |
| `POST` | `/api/documents` | Upload a PDF | - | - | `multipart/form-data` | `DocumentDto` | 201 Created | 400 |
| `GET` | `/api/documents/{id}` | Get document details | `id` | - | - | `DocumentDto` | 200 OK | 404 |
| `GET` | `/api/documents/{id}/pages` | Get extracted pages | `id` | `from`, `to` | - | `DocumentPageListDto` | 200 OK | 400, 404 |
| `PATCH` | `/api/documents/{id}/archive` | Archive document | `id` | - | - | `DocumentDto` | 200 OK | 404, 409 |
| `PATCH` | `/api/documents/{id}/restore` | Restore document | `id` | - | - | `DocumentDto` | 200 OK | 404, 409 |

## Generation Runs & Generated Cards
`GenerationRunController`

| Method | Path | Purpose | Path Params | Query Params | Request Body | Response Type | Success Status | Errors |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/documents/{documentId}/generation-runs` | Start generation | `documentId` | - | `GenerationRunRequest` | `GenerationRunResponse` | 201 Created | 400, 404 |
| `GET` | `/api/generation-runs/{runId}` | Get run status | `runId` | - | - | `GenerationRunResponse` | 200 OK | 404 |
| `GET` | `/api/generation-runs/{runId}/flashcards` | List cards from run | `runId` | - | - | `List<FlashcardResponse>` | 200 OK | 404 |

## Practice Sessions & Results
`PracticeController`

| Method | Path | Purpose | Path Params | Query Params | Request Body | Response Type | Success Status | Errors |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/decks/{deckId}/practice-sessions` | Start practice | `deckId` | `mode`, `incorrectOnly`, `sourceSessionId` | - | `PracticeSessionResponse` | 200 OK | 400, 404, 409 |
| `GET` | `/api/practice-sessions/{sessionId}` | Get active session | `sessionId` | - | - | `PracticeSessionResponse` | 200 OK | 404 |
| `POST` | `/api/practice-sessions/{sessionId}/cards/{sessionCardId}/result` | Submit answer | `sessionId`, `sessionCardId` | - | `PracticeAttemptRequest` | `PracticeSessionResponse` | 200 OK | 400, 404 |
| `PATCH` | `/api/practice-sessions/{sessionId}/cancel` | Cancel session | `sessionId` | - | - | - | 204 No Content | 404 |
| `GET` | `/api/practice-sessions/{sessionId}/summary` | Get session summary | `sessionId` | - | - | `PracticeSummaryResponse` | 200 OK | 404 |
