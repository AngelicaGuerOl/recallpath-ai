import type { DeckQuery } from '../../domain/entities/Deck'
import type { DeckRepository } from '../../domain/repositories/DeckRepository'

export class GetDecksUseCase {
  private readonly deckRepository: DeckRepository

  constructor(deckRepository: DeckRepository) {
    this.deckRepository = deckRepository
  }

  execute(query: DeckQuery) {
    return this.deckRepository.getDecks(query)
  }
}
