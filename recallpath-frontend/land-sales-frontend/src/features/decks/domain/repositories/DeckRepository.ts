import type { Deck, DeckFormInput, DeckPage, DeckQuery } from '../entities/Deck'

export interface DeckRepository {
  getDecks(query: DeckQuery): Promise<DeckPage>
  getDeck(id: number): Promise<Deck>
  createDeck(input: DeckFormInput): Promise<Deck>
  updateDeck(id: number, input: DeckFormInput): Promise<Deck>
  archiveDeck(id: number): Promise<Deck>
}
