import { useQuery } from '@tanstack/react-query'
import { getDocument, getDocumentPages, getDocuments } from '../../api/documentsApi'
import type { DocumentQuery } from '../../domain/entities/Document'
import { documentKeys } from './documentQueryKeys'

export function useDocuments(query: DocumentQuery) {
  return useQuery({
    queryKey: documentKeys.list(query),
    queryFn: () => getDocuments(query),
  })
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocument(id),
    enabled: !isNaN(id),
  })
}

export function useDocumentPages(id: number, from: number, to: number) {
  return useQuery({
    queryKey: documentKeys.pages(id, from, to),
    queryFn: () => getDocumentPages(id, from, to),
    enabled: !isNaN(id) && from > 0 && to >= from,
  })
}
