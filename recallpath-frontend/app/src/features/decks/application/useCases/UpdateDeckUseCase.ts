import type { DeckFormInput } from '../../domain/entities/Deck'
import type { DeckRepository } from '../../domain/repositories/DeckRepository'

export class UpdateDeckUseCase {
  private readonly deckRepository: DeckRepository

  constructor(deckRepository: DeckRepository) {
    this.deckRepository = deckRepository
  }

  execute(id: number, input: DeckFormInput) {
    return this.deckRepository.updateDeck(id, input)
  }
}
