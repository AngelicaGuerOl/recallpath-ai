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
  id: 1,
  deckId: 1,
  term: 'What is photosynthesis?',
  definition: 'The process by which plants make their own food',
  category: 'Biology',
  difficulty: 'MEDIUM',
  status: 'ACTIVE',
  origin: 'MANUAL',
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z'
}

export const archivedFlashcard: Flashcard = {
  id: 2,
  deckId: 1,
  term: 'What is gravity?',
  definition: 'The force that attracts a body toward the center of the earth',
  category: null,
  difficulty: 'HARD',
  status: 'ARCHIVED',
  origin: 'MANUAL',
  createdAt: '2023-01-02T10:00:00Z',
  updatedAt: '2023-01-03T10:00:00Z'
}

export function flashcardList(cards: Flashcard[] = [activeFlashcard]): Flashcard[] {
  return cards
}
