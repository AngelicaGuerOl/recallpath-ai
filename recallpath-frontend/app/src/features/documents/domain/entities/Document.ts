export type DocumentStatus = 'UPLOADED' | 'EXTRACTING' | 'READY' | 'FAILED' | 'ARCHIVED'

export type Document = {
  id: number
  originalFileName: string
  contentType: string
  fileSize: number
  pageCount: number | null
  status: DocumentStatus
  errorMessage: string | null
  createdAt: string
}

export type DocumentPage = {
  id: number
  pageNumber: number
  extractedText: string
  characterCount: number
}

export type DocumentPageList = {
  pages: DocumentPage[]
  totalPages: number
}

export type DocumentQuery = {
  search?: string
  status?: DocumentStatus
}
