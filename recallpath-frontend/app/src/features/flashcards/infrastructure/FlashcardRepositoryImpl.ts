import { httpClient } from '../../../shared/api/httpClient'
import type { Flashcard, FlashcardFormInput } from '../domain/entities/Flashcard'
import type { FlashcardRepository } from '../domain/repositories/FlashcardRepository'
import { FlashcardMapper, type FlashcardDto } from './mappers/FlashcardMapper'

export class FlashcardRepositoryImpl implements FlashcardRepository {
  async getFlashcards(deckId: number): Promise<Flashcard[]> {
    const dtos = await httpClient.get<FlashcardDto[]>(`/decks/${deckId}/flashcards`)
    return dtos.map(FlashcardMapper.toFlashcard)
  }

  async createFlashcard(deckId: number, input: FlashcardFormInput): Promise<Flashcard> {
    const dto = await httpClient.post<FlashcardDto>(`/decks/${deckId}/flashcards`, input)
    return FlashcardMapper.toFlashcard(dto)
  }

  async updateFlashcard(deckId: number, cardId: number, input: FlashcardFormInput): Promise<Flashcard> {
    const dto = await httpClient.put<FlashcardDto>(`/decks/${deckId}/flashcards/${cardId}`, input)
    return FlashcardMapper.toFlashcard(dto)
  }

  async archiveFlashcard(deckId: number, cardId: number): Promise<Flashcard> {
    const dto = await httpClient.patch<FlashcardDto>(`/decks/${deckId}/flashcards/${cardId}/archive`)
    return FlashcardMapper.toFlashcard(dto)
  }

  async restoreFlashcard(deckId: number, cardId: number): Promise<Flashcard> {
    const dto = await httpClient.patch<FlashcardDto>(`/decks/${deckId}/flashcards/${cardId}/restore`)
    return FlashcardMapper.toFlashcard(dto)
  }
}
