import type { DocumentQuery } from '../../domain/entities/Document'

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (query: DocumentQuery) => [...documentKeys.lists(), query] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentKeys.details(), id] as const,
  pages: (id: number, from: number, to: number) => [...documentKeys.detail(id), 'pages', from, to] as const,
}
