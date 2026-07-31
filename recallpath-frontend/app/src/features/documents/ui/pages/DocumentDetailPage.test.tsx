import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DocumentDetailPage } from './DocumentDetailPage'
import { useDocument, useDocumentPages } from '../hooks/useDocuments'
import type { Document, DocumentPageList, DocumentStatus } from '../../domain/entities/Document'

vi.mock('../hooks/useDocuments', () => ({
  useDocument: vi.fn(),
  useDocumentPages: vi.fn(),
}))

import type { Mock } from 'vitest'

const mockUseDocument = useDocument as unknown as Mock
const mockUseDocumentPages = useDocumentPages as unknown as Mock

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/documents/1']}>
      <Routes>
        <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DocumentDetailPage', () => {
  const mockDoc: Document = {
    id: 1,
    originalFileName: 'test.pdf',
    contentType: 'application/pdf',
    fileSize: 1048576,
    pageCount: 3,
    status: 'READY' as DocumentStatus,
    errorMessage: null,
    createdAt: new Date().toISOString()
  }

  const mockPages: DocumentPageList = {
    pages: [
      { id: 101, pageNumber: 1, extractedText: 'Texto de la página 1 con salto\nDe línea.', characterCount: 38 },
      { id: 102, pageNumber: 2, extractedText: 'Texto de la página 2 completo.', characterCount: 30 },
      { id: 103, pageNumber: 3, extractedText: 'Texto con discrepancia.', characterCount: 100 } // characterCount 100 but length is 23
    ],
    totalPages: 3
  }

  it('renders loading state', () => {
    mockUseDocument.mockReturnValue({ isLoading: true })
    mockUseDocumentPages.mockReturnValue({ data: null, isLoading: true })

    renderComponent()
    expect(screen.getByText('Cargando documento...')).toBeInTheDocument()
  })

  it('renders error state if document load fails', () => {
    mockUseDocument.mockReturnValue({ isError: true })
    mockUseDocumentPages.mockReturnValue({ data: null })

    renderComponent()
    expect(screen.getByText('No fue posible cargar el documento.')).toBeInTheDocument()
  })

  it('renders document details and translated status', () => {
    mockUseDocument.mockReturnValue({ data: mockDoc })
    mockUseDocumentPages.mockReturnValue({ data: mockPages })

    renderComponent()
    expect(screen.getByText('test.pdf')).toBeInTheDocument()
    expect(screen.getByText(/Listo/)).toBeInTheDocument()
  })

  it('renders the first page of the selected interval in the viewer completely', () => {
    mockUseDocument.mockReturnValue({ data: mockDoc })
    mockUseDocumentPages.mockReturnValue({ data: mockPages })

    renderComponent()
    
    // Debería mostrar la primera página seleccionada
    expect(screen.getByText('Página 1')).toBeInTheDocument()
    
    // Verificar que el texto se renderiza completo sin recortes (substring).
    expect(screen.getByText(/Texto de la página 1 con salto/)).toBeInTheDocument()
    
    // Verificar que el contenedor tiene whiteSpace: pre-wrap
    const textElement = screen.getByText(/Texto de la página 1 con salto/)
    expect(window.getComputedStyle(textElement).whiteSpace).toBe('pre-wrap')
  })

  it('allows navigation with anterior and siguiente buttons, disabling at bounds', () => {
    mockUseDocument.mockReturnValue({ data: mockDoc })
    mockUseDocumentPages.mockReturnValue({ data: mockPages })

    renderComponent()

    // Inicio: página 1, Anterior deshabilitado, Siguiente habilitado
    expect(screen.getByText('Página 1')).toBeInTheDocument()
    const prevButton = screen.getByRole('button', { name: /Página anterior/i })
    const nextButton = screen.getByRole('button', { name: /Página siguiente/i })
    
    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    // Clic Siguiente
    fireEvent.click(nextButton)
    expect(screen.getByText('Página 2')).toBeInTheDocument()
    expect(prevButton).not.toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    // Clic Siguiente
    fireEvent.click(nextButton)
    expect(screen.getByText('Página 3')).toBeInTheDocument()
    expect(prevButton).not.toBeDisabled()
    expect(nextButton).toBeDisabled()

    // Clic Anterior
    fireEvent.click(prevButton)
    expect(screen.getByText('Página 2')).toBeInTheDocument()
  })

  it('resets the view index when the interval changes', () => {
    mockUseDocument.mockReturnValue({ data: mockDoc })
    mockUseDocumentPages.mockReturnValue({ data: mockPages })

    renderComponent()

    // Mover a la página 2
    const nextButton = screen.getByRole('button', { name: /Página siguiente/i })
    fireEvent.click(nextButton)
    expect(screen.getByText('Página 2')).toBeInTheDocument()

    // Cambiar intervalo (From)
    const fromInput = screen.getByLabelText(/Desde la página/i)
    fireEvent.change(fromInput, { target: { value: '2' } })

    // El índice debe reiniciarse al primer elemento de lo nuevo
    expect(screen.getByText('Página 1')).toBeInTheDocument() 
    // Nota: El mock pages siempre devuelve la misma data mockPages, por lo que el índice 0 sigue siendo la página 1 del mock.
  })

  it('displays discrepancy warning and irregular extraction notice', () => {
    mockUseDocument.mockReturnValue({ data: mockDoc })
    mockUseDocumentPages.mockReturnValue({ data: mockPages })

    renderComponent()

    expect(screen.getByText(/La cantidad de caracteres reportada no coincide/i)).toBeInTheDocument()
    expect(screen.getByText(/La distribución del texto puede variar/i)).toBeInTheDocument()
  })

  it('shows selected pages count and total characters', () => {
    mockUseDocument.mockReturnValue({ data: mockDoc })
    mockUseDocumentPages.mockReturnValue({ data: mockPages })

    renderComponent()
    // Default from 1 to 1 = 1 página
    expect(screen.getByText(/1 página seleccionada/i)).toBeInTheDocument()
    // Sum of character counts in mockPages = 38 + 30 + 100 = 168
    expect(screen.getByText(/168 caracteres en total/i)).toBeInTheDocument()
  })
})
