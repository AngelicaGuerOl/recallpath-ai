import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deckDependencies } from '../../dependencies'
import type { DeckFormInput } from '../../domain/entities/Deck'
import { deckQueryKeys } from './deckQueryKeys'

export function useCreateDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DeckFormInput) => deckDependencies.createDeckUseCase.execute(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() }),
  })
}

export function useUpdateDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DeckFormInput }) => deckDependencies.updateDeckUseCase.execute(id, input),
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() })
      queryClient.setQueryData(deckQueryKeys.detail(deck.id), deck)
    },
  })
}

export function useArchiveDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deckDependencies.archiveDeckUseCase.execute(id),
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() })
      queryClient.setQueryData(deckQueryKeys.detail(deck.id), deck)
    },
  })
}

export function useUnarchiveDeck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deckDependencies.unarchiveDeckUseCase.execute(id),
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: deckQueryKeys.lists() })
      queryClient.setQueryData(deckQueryKeys.detail(deck.id), deck)
    },
  })
}
