import type { FlashcardRepository } from '../../domain/repositories/FlashcardRepository'

export class ArchiveFlashcardUseCase {
  private readonly repository: FlashcardRepository

  constructor(repository: FlashcardRepository) {
    this.repository = repository
  }

  execute(deckId: number, cardId: number) {
    return this.repository.archiveFlashcard(deckId, cardId)
  }
}
