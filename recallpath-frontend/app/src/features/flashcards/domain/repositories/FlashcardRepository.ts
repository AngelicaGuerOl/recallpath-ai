import type { Flashcard, FlashcardFormInput, FlashcardStatus } from '../entities/Flashcard'

export interface FlashcardRepository {
  getFlashcards(deckId: number, status?: FlashcardStatus): Promise<Flashcard[]>
  createFlashcard(deckId: number, input: FlashcardFormInput): Promise<Flashcard>
  updateFlashcard(deckId: number, cardId: number, input: FlashcardFormInput): Promise<Flashcard>
  archiveFlashcard(deckId: number, cardId: number): Promise<Flashcard>
  restoreFlashcard(deckId: number, cardId: number): Promise<Flashcard>
  approveFlashcard(deckId: number, cardId: number): Promise<Flashcard>
  rejectFlashcard(deckId: number, cardId: number): Promise<Flashcard>
  approveBatch(deckId: number, flashcardIds: number[]): Promise<void>
}
