import { httpClient } from '../../../shared/api/httpClient'
import type { Deck, DeckFormInput, DeckPage, DeckQuery } from '../domain/entities/Deck'
import type { DeckRepository } from '../domain/repositories/DeckRepository'
import { DeckMapper, type DeckDto, type DeckPageDto } from './mappers/DeckMapper'

export class DeckRepositoryImpl implements DeckRepository {
  async getDecks(query: DeckQuery): Promise<DeckPage> {
    const params = new URLSearchParams()
    params.set('page', String(query.page))
    params.set('size', String(query.size))
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.archived !== undefined) params.set('archived', String(query.archived))

    const response = await httpClient.get<DeckPageDto>(`/decks?${params.toString()}`)
    return DeckMapper.toPage(response)
  }

  async getDeck(id: number): Promise<Deck> {
    const response = await httpClient.get<DeckDto>(`/decks/${id}`)
    return DeckMapper.toDeck(response)
  }

  async createDeck(input: DeckFormInput): Promise<Deck> {
    const response = await httpClient.post<DeckDto>('/decks', input)
    return DeckMapper.toDeck(response)
  }

  async updateDeck(id: number, input: DeckFormInput): Promise<Deck> {
    const response = await httpClient.put<DeckDto>(`/decks/${id}`, input)
    return DeckMapper.toDeck(response)
  }

  async archiveDeck(id: number): Promise<Deck> {
    const response = await httpClient.patch<DeckDto>(`/decks/${id}/archive`)
    return DeckMapper.toDeck(response)
  }
}
