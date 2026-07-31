export type FlashcardDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type FlashcardStatus = 'ACTIVE' | 'ARCHIVED' | 'GENERATED' | 'REJECTED'

export type Flashcard = {
  id: number
  deckId: number
  term: string
  definition: string
  category: string | null
  difficulty: FlashcardDifficulty
  status: FlashcardStatus
  origin: string
  generationRunId?: number
  sourcePage?: number
  sourceExcerpt?: string
  createdAt: string
  updatedAt: string
}

export type FlashcardFormInput = {
  term: string
  definition: string
  category: string | null
  difficulty: FlashcardDifficulty
}
