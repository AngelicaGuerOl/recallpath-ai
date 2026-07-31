import type { Flashcard } from '../../domain/entities/Flashcard'

export type FlashcardDto = {
  id: number
  deckId: number
  term: string
  definition: string
  category: string | null
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  status: 'ACTIVE' | 'ARCHIVED' | 'GENERATED' | 'REJECTED'
  origin: string
  generationRunId?: number
  sourcePage?: number
  sourceExcerpt?: string
  createdAt: string
  updatedAt: string
}

export const FlashcardMapper = {
  toFlashcard(dto: FlashcardDto): Flashcard {
    return { ...dto }
  },
}
