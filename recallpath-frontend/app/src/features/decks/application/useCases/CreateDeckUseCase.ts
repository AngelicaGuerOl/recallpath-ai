import type { DeckFormInput } from '../../domain/entities/Deck'
import type { DeckRepository } from '../../domain/repositories/DeckRepository'

export class CreateDeckUseCase {
  private readonly deckRepository: DeckRepository

  constructor(deckRepository: DeckRepository) {
    this.deckRepository = deckRepository
  }

  execute(input: DeckFormInput) {
    return this.deckRepository.createDeck(input)
  }
}
