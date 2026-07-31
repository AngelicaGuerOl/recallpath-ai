import type { FlashcardFormInput } from '../../domain/entities/Flashcard'
import type { FlashcardRepository } from '../../domain/repositories/FlashcardRepository'

export class CreateFlashcardUseCase {
  private readonly repository: FlashcardRepository

  constructor(repository: FlashcardRepository) {
    this.repository = repository
  }

  execute(deckId: number, input: FlashcardFormInput) {
    return this.repository.createFlashcard(deckId, input)
  }
}
