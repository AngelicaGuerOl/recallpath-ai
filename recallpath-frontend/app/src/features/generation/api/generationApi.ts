import { httpClient } from "../../../shared/api/httpClient";

export interface GenerationRunRequest {
  deckId: number;
  pageFrom: number;
  pageTo: number;
  requestedCardCount: number;
  language: string;
  difficulty: string;
  contentTypes: string[];
}

export interface GenerationRunResponse {
  id: number;
  documentId: number;
  deckId: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  selectedPageFrom: number;
  selectedPageTo: number;
  requestedCardCount: number;
  language: string;
  difficulty: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export async function createGenerationRun(documentId: number, data: GenerationRunRequest): Promise<GenerationRunResponse> {
  return httpClient.post<GenerationRunResponse>(`/documents/${documentId}/generation-runs`, data);
}

export async function getGenerationRun(runId: number): Promise<GenerationRunResponse> {
  return httpClient.get<GenerationRunResponse>(`/generation-runs/${runId}`);
}

export async function getGeneratedFlashcards(runId: number): Promise<unknown[]> {
  return httpClient.get<unknown[]>(`/generation-runs/${runId}/flashcards`);
}
