import type { FlashcardRepository } from '../../domain/repositories/FlashcardRepository'

export class RejectFlashcardUseCase {
  private readonly repository: FlashcardRepository

  constructor(repository: FlashcardRepository) {
    this.repository = repository
  }

  execute(deckId: number, cardId: number) {
    return this.repository.rejectFlashcard(deckId, cardId)
  }
}
