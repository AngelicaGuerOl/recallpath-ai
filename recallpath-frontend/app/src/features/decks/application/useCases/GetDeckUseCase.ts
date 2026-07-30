import type { DeckRepository } from '../../domain/repositories/DeckRepository'

export class GetDeckUseCase {
  private readonly deckRepository: DeckRepository

  constructor(deckRepository: DeckRepository) {
    this.deckRepository = deckRepository
  }

  execute(id: number) {
    return this.deckRepository.getDeck(id)
  }
}
