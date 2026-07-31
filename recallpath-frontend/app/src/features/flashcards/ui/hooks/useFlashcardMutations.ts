import { useMutation, useQueryClient } from '@tanstack/react-query'
import { flashcardDependencies } from '../../dependencies'
import type { FlashcardFormInput } from '../../domain/entities/Flashcard'
import { flashcardQueryKeys } from './flashcardQueryKeys'
import { deckQueryKeys } from '../../../decks/ui/hooks/deckQueryKeys'

export function useCreateFlashcard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FlashcardFormInput) =>
      flashcardDependencies.createFlashcardUseCase.execute(deckId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) })
    },
  })
}

export function useUpdateFlashcard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: number; input: FlashcardFormInput }) =>
      flashcardDependencies.updateFlashcardUseCase.execute(deckId, cardId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
    },
  })
}

export function useArchiveFlashcard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: number) =>
      flashcardDependencies.archiveFlashcardUseCase.execute(deckId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) })
    },
  })
}

export function useRestoreFlashcard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: number) =>
      flashcardDependencies.restoreFlashcardUseCase.execute(deckId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) })
    },
  })
}

export function useApproveFlashcard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: number) =>
      flashcardDependencies.approveFlashcardUseCase.execute(deckId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) })
      queryClient.invalidateQueries({ queryKey: ['generationRun'] })
    },
  })
}

export function useRejectFlashcard(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: number) =>
      flashcardDependencies.rejectFlashcardUseCase.execute(deckId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
      queryClient.invalidateQueries({ queryKey: ['generationRun'] })
    },
  })
}

export function useApproveBatchFlashcards(deckId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flashcardIds: number[]) =>
      flashcardDependencies.approveBatchFlashcardsUseCase.execute(deckId, flashcardIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardQueryKeys.byDeck(deckId) })
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.detail(deckId) })
      queryClient.invalidateQueries({ queryKey: ['generationRun'] })
    },
  })
}
