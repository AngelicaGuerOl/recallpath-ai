import type { FlashcardRepository } from '../../domain/repositories/FlashcardRepository'

export class GetFlashcardsUseCase {
  private readonly repository: FlashcardRepository

  constructor(repository: FlashcardRepository) {
    this.repository = repository
  }

  execute(deckId: number) {
    return this.repository.getFlashcards(deckId)
  }
}
