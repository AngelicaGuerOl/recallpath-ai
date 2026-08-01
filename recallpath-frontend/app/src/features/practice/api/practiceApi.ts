import { httpClient } from '../../../shared/api/httpClient'
import type { PracticeAttemptInput, PracticeMode, PracticeSession, PracticeSummary } from '../domain/entities/Practice'

export async function startOrResumePracticeSession(
  deckId: number,
  mode: PracticeMode = 'FLASHCARDS',
  incorrectOnly?: boolean,
  sourceSessionId?: number,
): Promise<PracticeSession> {
  const params = new URLSearchParams({ mode })
  if (incorrectOnly) params.set('incorrectOnly', 'true')
  if (sourceSessionId !== undefined) params.set('sourceSessionId', String(sourceSessionId))
  return await httpClient.post<PracticeSession>(`/decks/${deckId}/practice-sessions?${params}`, undefined)
}

export async function getPracticeSession(sessionId: number): Promise<PracticeSession> {
  return await httpClient.get<PracticeSession>(`/practice-sessions/${sessionId}`)
}

export async function submitPracticeAttempt(
  sessionId: number,
  sessionCardId: number,
  input: PracticeAttemptInput,
): Promise<PracticeSession> {
  return await httpClient.post<PracticeSession>(
    `/practice-sessions/${sessionId}/cards/${sessionCardId}/result`,
    input,
  )
}

export async function cancelPracticeSession(sessionId: number): Promise<void> {
  await httpClient.patch(`/practice-sessions/${sessionId}/cancel`)
}

export async function getPracticeSummary(sessionId: number): Promise<PracticeSummary> {
  return await httpClient.get<PracticeSummary>(`/practice-sessions/${sessionId}/summary`)
}
