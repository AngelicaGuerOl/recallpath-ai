export type Deck = {
  id: number
  name: string
  description: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type DeckFormInput = {
  name: string
  description: string | null
}

export type DeckQuery = {
  page: number
  size: number
  search?: string
  archived?: boolean
}

export type DeckPage = {
  content: Deck[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
