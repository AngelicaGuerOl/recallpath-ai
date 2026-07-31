import { httpClient } from '../../../shared/api/httpClient'
import type { Document, DocumentPageList, DocumentQuery } from '../domain/entities/Document'

import { env } from '../../../app/config/env'

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${env.apiBaseUrl}/documents`, {
    method: 'POST',
    body: formData,
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    // ignorar error de parseo si devuelve HTML
  }

  if (!response.ok) {
    throw new Error(payload?.message ?? response.statusText ?? 'Error al subir el archivo')
  }
  return payload as Document
}

export async function getDocuments(query?: DocumentQuery): Promise<Document[]> {
  const params = new URLSearchParams()
  if (query?.search) params.append('search', query.search)
  if (query?.status) params.append('status', query.status)

  return await httpClient.get<Document[]>(`/documents?${params.toString()}`)
}

export async function getDocument(id: number): Promise<Document> {
  return await httpClient.get<Document>(`/documents/${id}`)
}

export async function getDocumentPages(id: number, from: number, to: number): Promise<DocumentPageList> {
  return await httpClient.get<DocumentPageList>(`/documents/${id}/pages?from=${from}&to=${to}`)
}

export async function archiveDocument(id: number): Promise<Document> {
  return await httpClient.patch<Document>(`/documents/${id}/archive`)
}

export async function restoreDocument(id: number): Promise<Document> {
  return await httpClient.patch<Document>(`/documents/${id}/restore`)
}
