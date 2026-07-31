import type { Deck, DeckPage } from '../features/decks/domain/entities/Deck'
import type { Flashcard } from '../features/flashcards/domain/entities/Flashcard'

export const activeDeck: Deck = {
  id: 1,
  name: 'Spring Boot',
  description: 'Conceptos para entrevistas técnicas',
  archivedAt: null,
  createdAt: '2026-07-29T10:00:00',
  updatedAt: '2026-07-29T12:00:00',
}

export const reactDeck: Deck = {
  id: 2,
  name: 'React',
  description: null,
  archivedAt: null,
  createdAt: '2026-07-28T10:00:00',
  updatedAt: '2026-07-28T12:00:00',
}

export const archivedDeck: Deck = {
  id: 3,
  name: 'SQL archivado',
  description: 'Historial',
  archivedAt: '2026-07-30T09:00:00',
  createdAt: '2026-07-25T10:00:00',
  updatedAt: '2026-07-30T09:00:00',
}

export function deckPage(content: Deck[], overrides: Partial<DeckPage> = {}): DeckPage {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
    first: true,
    last: true,
    ...overrides,
  }
}

export const activeFlashcard: Flashcard = {
  id: 10,
  deckId: 1,
  term: 'IoC Container',
  definition: 'Gestiona la creación y ciclo de vida de los beans en Spring.',
  category: 'Core',
  difficulty: 'MEDIUM',
  status: 'ACTIVE',
  createdAt: '2026-07-29T11:00:00',
  updatedAt: '2026-07-29T11:00:00',
}

export const archivedFlashcard: Flashcard = {
  id: 11,
  deckId: 1,
  term: 'AOP',
  definition: 'Programación orientada a aspectos.',
  category: null,
  difficulty: 'HARD',
  status: 'ARCHIVED',
  createdAt: '2026-07-28T10:00:00',
  updatedAt: '2026-07-29T10:00:00',
}

export function flashcardList(cards: Flashcard[] = [activeFlashcard]): Flashcard[] {
  return cards
}
