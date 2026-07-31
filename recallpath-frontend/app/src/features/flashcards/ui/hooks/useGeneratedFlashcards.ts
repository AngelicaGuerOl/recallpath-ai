import { useQuery } from '@tanstack/react-query'


import { getGeneratedFlashcards } from '../../../../features/generation/api/generationApi'

export function useGeneratedFlashcards(runId: number | undefined) {
  return useQuery({
    queryKey: ['generationRun', runId, 'flashcards'],
    queryFn: () => getGeneratedFlashcards(runId!),
    enabled: !!runId,
  })
}
