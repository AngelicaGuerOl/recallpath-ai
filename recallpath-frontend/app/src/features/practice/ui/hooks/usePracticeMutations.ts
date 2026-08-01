import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  cancelPracticeSession,
  startOrResumePracticeSession,
  submitPracticeAttempt,
} from '../../api/practiceApi'
import type { PracticeAttemptInput, PracticeMode } from '../../domain/entities/Practice'
import { practiceQueryKeys } from './practiceQueryKeys'

type StartPracticeInput = {
  deckId: number
  mode?: PracticeMode
  incorrectOnly?: boolean
  sourceSessionId?: number
}

export function useStartPracticeSession() {
  return useMutation({
    mutationFn: ({ deckId, mode, incorrectOnly, sourceSessionId }: StartPracticeInput) =>
      startOrResumePracticeSession(deckId, mode, incorrectOnly, sourceSessionId),
  })
}

export function useSubmitPracticeResult(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: number; input: PracticeAttemptInput }) =>
      submitPracticeAttempt(sessionId, cardId, input),
    onSuccess: (updatedSession) => {
      // Actualizar la sesión en caché inmediatamente para reflejar el nuevo estado
      queryClient.setQueryData(practiceQueryKeys.session(sessionId), updatedSession)
    },
  })
}

export function useCancelPracticeSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelPracticeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: practiceQueryKeys.session(sessionId) })
    },
  })
}
