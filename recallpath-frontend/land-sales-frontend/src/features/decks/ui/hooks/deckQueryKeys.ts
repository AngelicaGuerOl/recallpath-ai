import type { DeckQuery } from '../../domain/entities/Deck'

export const deckQueryKeys = {
  all: ['decks'] as const,
  lists: () => [...deckQueryKeys.all, 'list'] as const,
  list: (query: DeckQuery) => [...deckQueryKeys.lists(), query] as const,
  detail: (id: number) => [...deckQueryKeys.all, 'detail', id] as const,
}
