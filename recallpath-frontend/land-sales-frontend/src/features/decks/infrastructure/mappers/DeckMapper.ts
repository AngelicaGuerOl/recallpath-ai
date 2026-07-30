import type { Deck, DeckPage } from '../../domain/entities/Deck'

export type DeckDto = {
  id: number
  name: string
  description: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type DeckPageDto = {
  content: DeckDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export const DeckMapper = {
  toDeck(dto: DeckDto): Deck {
    return { ...dto }
  },
  toPage(dto: DeckPageDto): DeckPage {
    return {
      ...dto,
      content: dto.content.map(DeckMapper.toDeck),
    }
  },
}
