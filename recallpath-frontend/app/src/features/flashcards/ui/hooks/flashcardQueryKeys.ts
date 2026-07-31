export const flashcardQueryKeys = {
  all: ['flashcards'] as const,
  byDeck: (deckId: number) => [...flashcardQueryKeys.all, 'deck', deckId] as const,
}
