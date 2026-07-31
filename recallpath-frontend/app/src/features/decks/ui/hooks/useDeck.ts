import { useQuery } from '@tanstack/react-query'
import { deckDependencies } from '../../dependencies'
import { deckQueryKeys } from './deckQueryKeys'

export function useDeck(id: number) {
  return useQuery({
    queryKey: deckQueryKeys.detail(id),
    queryFn: () => deckDependencies.getDeckUseCase.execute(id),
    enabled: !isNaN(id) && id > 0,
  })
}
