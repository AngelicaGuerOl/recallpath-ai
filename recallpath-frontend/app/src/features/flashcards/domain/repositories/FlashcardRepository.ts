import type { Flashcard, FlashcardFormInput } from '../entities/Flashcard'

export interface FlashcardRepository {
  getFlashcards(deckId: number): Promise<Flashcard[]>
  createFlashcard(deckId: number, input: FlashcardFormInput): Promise<Flashcard>
  updateFlashcard(deckId: number, cardId: number, input: FlashcardFormInput): Promise<Flashcard>
  archiveFlashcard(deckId: number, cardId: number): Promise<Flashcard>
  restoreFlashcard(deckId: number, cardId: number): Promise<Flashcard>
}
