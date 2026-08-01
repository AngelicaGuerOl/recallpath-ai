export type PracticeMode = 'FLASHCARDS' | 'MULTIPLE_CHOICE' | 'WRITTEN_RESPONSE'

export type PracticeStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type PracticeResult = 'INCORRECT' | 'DIFFICULT' | 'CORRECT' | 'EASY'

/** Una opción en una pregunta de opción múltiple. */
export type MultipleChoiceOption = {
  text: string
  correct: boolean
}

export type PracticeSessionCard = {
  id: number
  position: number
  termSnapshot: string
  definitionSnapshot: string
  categorySnapshot: string | null
  difficultySnapshot: string
  answered: boolean
  /** Solo presente en sesiones con mode === 'MULTIPLE_CHOICE'. */
  options: MultipleChoiceOption[] | null
}

export type PracticeSession = {
  id: number
  deckId: number
  mode: PracticeMode
  status: PracticeStatus
  totalCards: number
  completedCards: number
  currentCard: PracticeSessionCard | null
  lastEvaluation?: {
    correct: boolean
    feedback: string
  } | null
  startedAt: string
  completedAt: string | null
}

/** Resumen de una tarjeta incorrecta, incluida en el resumen de sesión. */
export type IncorrectCardSummary = {
  term: string
  definition: string
  userAnswer?: string
  feedback?: string
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
  incorrectCards: IncorrectCardSummary[]
}

export type PracticeAttemptInput = {
  result?: PracticeResult
  responseTimeMs: number
  userAnswer?: string
}
