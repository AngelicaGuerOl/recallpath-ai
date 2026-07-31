import type { FlashcardRepository } from '../../domain/repositories/FlashcardRepository'

export class ApproveBatchFlashcardsUseCase {
  private readonly repository: FlashcardRepository

  constructor(repository: FlashcardRepository) {
    this.repository = repository
  }

  execute(deckId: number, flashcardIds: number[]) {
    return this.repository.approveBatch(deckId, flashcardIds)
  }
}
