import { useMutation, useQuery } from '@tanstack/react-query';
import { createGenerationRun, getGenerationRun } from '../api/generationApi';
import type { GenerationRunRequest } from '../api/generationApi';

export function useCreateGenerationRun() {
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: number; data: GenerationRunRequest }) =>
      createGenerationRun(documentId, data),
    onSuccess: () => {
      // Invalidar si es necesario
    },
  });
}

export function useGenerationRun(runId: number | undefined) {
  return useQuery({
    queryKey: ['generationRun', runId],
    queryFn: () => getGenerationRun(runId!),
    enabled: !!runId,
  });
}
