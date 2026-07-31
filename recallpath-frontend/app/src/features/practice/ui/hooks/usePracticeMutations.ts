import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  cancelPracticeSession,
  startOrResumePracticeSession,
  submitPracticeAttempt,
} from '../../api/practiceApi'
import type { PracticeAttemptInput, PracticeMode } from '../../domain/entities/Practice'
import { practiceQueryKeys } from './practiceQueryKeys'

export function useStartPracticeSession() {
  return useMutation({
    mutationFn: ({ deckId, mode }: { deckId: number; mode?: PracticeMode }) =>
      startOrResumePracticeSession(deckId, mode),
  })
}

export function useSubmitPracticeResult(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: number; input: PracticeAttemptInput }) =>
      submitPracticeAttempt(sessionId, cardId, input),
    onSuccess: (updatedSession) => {
      // Update session locally to reflect the new state immediately
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
