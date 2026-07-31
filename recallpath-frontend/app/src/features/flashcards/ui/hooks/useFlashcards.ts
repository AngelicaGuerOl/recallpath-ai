import { useQuery } from '@tanstack/react-query'
import { flashcardDependencies } from '../../dependencies'
import { flashcardQueryKeys } from './flashcardQueryKeys'

export function useFlashcards(deckId: number) {
  return useQuery({
    queryKey: flashcardQueryKeys.byDeck(deckId),
    queryFn: () => flashcardDependencies.getFlashcardsUseCase.execute(deckId),
  })
}
