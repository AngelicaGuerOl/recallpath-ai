export type PracticeMode = 'FLASHCARDS'

export type PracticeStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type PracticeResult = 'INCORRECT' | 'DIFFICULT' | 'CORRECT' | 'EASY'

export type PracticeSessionCard = {
  id: number
  position: number
  termSnapshot: string
  definitionSnapshot: string
  categorySnapshot: string | null
  difficultySnapshot: string
  answered: boolean
}

export type PracticeSession = {
  id: number
  deckId: number
  mode: PracticeMode
  status: PracticeStatus
  totalCards: number
  completedCards: number
  currentCard: PracticeSessionCard | null
  startedAt: string
  completedAt: string | null
}

export type PracticeSummary = {
  totalCards: number
  incorrectCount: number
  difficultCount: number
  correctCount: number
  easyCount: number
  accuracyPercentage: number
  startedAt: string
  completedAt: string | null
}

export type PracticeAttemptInput = {
  result: PracticeResult
  responseTimeMs: number
}
