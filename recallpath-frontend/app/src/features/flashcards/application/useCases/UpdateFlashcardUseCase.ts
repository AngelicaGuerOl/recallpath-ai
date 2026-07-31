import type { FlashcardFormInput } from '../../domain/entities/Flashcard'
import type { FlashcardRepository } from '../../domain/repositories/FlashcardRepository'

export class UpdateFlashcardUseCase {
  private readonly repository: FlashcardRepository

  constructor(repository: FlashcardRepository) {
    this.repository = repository
  }

  execute(deckId: number, cardId: number, input: FlashcardFormInput) {
    return this.repository.updateFlashcard(deckId, cardId, input)
  }
}
