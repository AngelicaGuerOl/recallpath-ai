import { useQuery } from '@tanstack/react-query'
import { deckDependencies } from '../../dependencies'
import type { DeckQuery } from '../../domain/entities/Deck'
import { deckQueryKeys } from './deckQueryKeys'

export function useDecks(query: DeckQuery) {
  return useQuery({
    queryKey: deckQueryKeys.list(query),
    queryFn: () => deckDependencies.getDecksUseCase.execute(query),
  })
}
