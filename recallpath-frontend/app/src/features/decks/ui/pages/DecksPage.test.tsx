import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { deckPage, activeDeck, archivedDeck, reactDeck } from '../../../../test/deckTestData'
import { renderWithProviders } from '../../../../test/render'
import { server } from '../../../../test/server'
import { DecksPage } from './DecksPage'

function renderDecksPage() {
  return renderWithProviders(<DecksPage />)
}

function useDecksSuccess(content = [activeDeck, reactDeck]) {
  server.use(
    http.get('/api/decks', () => HttpResponse.json(deckPage(content))),
  )
}

function getDialog() {
  return screen.getByRole('dialog')
}

async function openCreateForm() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Crear conjunto' }))
  return user
}

describe('DecksPage', () => {
  it('shows the loading state', () => {
    server.use(
      http.get('/api/decks', async () => {
        await delay(100)
        return HttpResponse.json(deckPage([activeDeck]))
      }),
    )

    renderDecksPage()

    expect(screen.getByText('Cargando conjuntos...')).toBeInTheDocument()
  })

  it('shows the empty state when no decks exist', async () => {
    useDecksSuccess([])

    renderDecksPage()

    expect(await screen.findByText('Crea tu primer conjunto')).toBeInTheDocument()
    expect(screen.getByText('Organiza un tema, agrega tarjetas manualmente o genera tarjetas desde un PDF.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear conjunto' })).toBeInTheDocument()
  })

  it('shows decks returned by the API', async () => {
    useDecksSuccess()

    renderDecksPage()

    expect(await screen.findByText('Spring Boot')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('2 conjunto(s)')).toBeInTheDocument()
  })

  it('shows the error state', async () => {
    server.use(http.get('/api/decks', () => HttpResponse.json({ message: 'Backend unavailable' }, { status: 500 })))

    renderDecksPage()

    expect(await screen.findByText('No fue posible cargar los conjuntos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('opens the creation form', async () => {
    useDecksSuccess([])
    renderDecksPage()
    await screen.findByText('Crea tu primer conjunto')

    await openCreateForm()

    expect(screen.getByRole('dialog', { name: 'Crear conjunto' })).toBeInTheDocument()
    expect(within(getDialog()).getByLabelText(/Nombre/)).toBeInTheDocument()
  })

  it('validates that name is required', async () => {
    useDecksSuccess([])
    renderDecksPage()
    await screen.findByText('Crea tu primer conjunto')
    const user = await openCreateForm()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
  })

  it('validates maximum lengths', async () => {
    useDecksSuccess([])
    renderDecksPage()
    await screen.findByText('Crea tu primer conjunto')
    const user = await openCreateForm()
    fireEvent.change(within(getDialog()).getByLabelText(/Nombre/), { target: { value: 'a'.repeat(121) } })
    fireEvent.change(within(getDialog()).getByLabelText('Descripción'), { target: { value: 'a'.repeat(501) } })

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre no puede superar 120 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('La descripción no puede superar 500 caracteres.')).toBeInTheDocument()
  })

  it('creates a deck with normalized request data and refreshes the list', async () => {
    const user = userEvent.setup()
    let listRequests = 0
    let receivedBody: unknown

    server.use(
      http.get('/api/decks', () => {
        listRequests += 1
        return HttpResponse.json(deckPage([]))
      }),
      http.post('/api/decks', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(activeDeck, { status: 201 })
      }),
    )

    renderDecksPage()
    await screen.findByText('Crea tu primer conjunto')
    await user.click(screen.getByRole('button', { name: 'Crear conjunto' }))
    fireEvent.change(within(getDialog()).getByLabelText(/Nombre/), { target: { value: '  Spring Boot  ' } })
    fireEvent.change(within(getDialog()).getByLabelText('Descripción'), { target: { value: '  Conceptos  ' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Conjunto creado correctamente.')).toBeInTheDocument()
    expect(receivedBody).toEqual({ name: 'Spring Boot', description: 'Conceptos' })
    await waitFor(() => expect(listRequests).toBeGreaterThan(1))
  })

  it('converts an empty description to null', async () => {
    const user = userEvent.setup()
    let receivedBody: unknown

    server.use(
      http.get('/api/decks', () => HttpResponse.json(deckPage([]))),
      http.post('/api/decks', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(activeDeck, { status: 201 })
      }),
    )

    renderDecksPage()
    await screen.findByText('Crea tu primer conjunto')
    await user.click(screen.getByRole('button', { name: 'Crear conjunto' }))
    fireEvent.change(within(getDialog()).getByLabelText(/Nombre/), { target: { value: 'Spring Boot' } })
    fireEvent.change(within(getDialog()).getByLabelText('Descripción'), { target: { value: '   ' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(receivedBody).toEqual({ name: 'Spring Boot', description: null }))
  })

  it('updates a deck', async () => {
    const user = userEvent.setup()
    let receivedBody: unknown

    server.use(
      http.get('/api/decks', () => HttpResponse.json(deckPage([activeDeck]))),
      http.put('/api/decks/1', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ ...activeDeck, name: 'Spring avanzado' })
      }),
    )

    renderDecksPage()
    await screen.findByText('Spring Boot')
    await user.click(screen.getByRole('button', { name: 'Editar Spring Boot' }))
    fireEvent.change(within(getDialog()).getByLabelText(/Nombre/), { target: { value: ' Spring avanzado ' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Conjunto actualizado correctamente.')).toBeInTheDocument()
    expect(receivedBody).toMatchObject({ name: 'Spring avanzado' })
  })

  it('requests confirmation before archiving', async () => {
    const user = userEvent.setup()
    useDecksSuccess([activeDeck])

    renderDecksPage()
    await screen.findByText('Spring Boot')
    await user.click(screen.getByRole('button', { name: 'Archivar Spring Boot' }))

    expect(screen.getByRole('dialog', { name: 'Archivar conjunto' })).toBeInTheDocument()
    expect(screen.getByText(/¿Quieres archivar "Spring Boot"/)).toBeInTheDocument()
  })

  it('archives a deck and refreshes the list', async () => {
    const user = userEvent.setup()
    let listRequests = 0
    let archived = false

    server.use(
      http.get('/api/decks', () => {
        listRequests += 1
        return HttpResponse.json(deckPage([activeDeck]))
      }),
      http.patch('/api/decks/1/archive', () => {
        archived = true
        return HttpResponse.json({ ...activeDeck, archivedAt: '2026-07-30T10:00:00' })
      }),
    )

    renderDecksPage()
    await screen.findByText('Spring Boot')
    await user.click(screen.getByRole('button', { name: 'Archivar Spring Boot' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archivar' }))

    expect(await screen.findByText('Conjunto archivado correctamente.')).toBeInTheDocument()
    expect(archived).toBe(true)
    await waitFor(() => expect(listRequests).toBeGreaterThan(1))
  })

  it('unarchives a deck and refreshes the list', async () => {
    const user = userEvent.setup()
    let listRequests = 0
    let unarchived = false

    server.use(
      http.get('/api/decks', () => {
        listRequests += 1
        return HttpResponse.json(deckPage([archivedDeck]))
      }),
      http.patch('/api/decks/3/unarchive', () => {
        unarchived = true
        return HttpResponse.json({ ...archivedDeck, archivedAt: null })
      }),
    )

    renderDecksPage()
    await screen.findByText('SQL archivado')
    await user.click(screen.getByRole('button', { name: 'Desarchivar SQL archivado' }))

    expect(await screen.findByText('Conjunto desarchivado correctamente.')).toBeInTheDocument()
    expect(unarchived).toBe(true)
    await waitFor(() => expect(listRequests).toBeGreaterThan(1))
  })

  it('shows backend error messages from mutations', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/decks', () => HttpResponse.json(deckPage([activeDeck]))),
      http.put('/api/decks/1', () => HttpResponse.json({ message: 'Archived deck cannot be modified' }, { status: 409 })),
    )

    renderDecksPage()
    await screen.findByText('Spring Boot')
    await user.click(screen.getByRole('button', { name: 'Editar Spring Boot' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Archived deck cannot be modified')).toBeInTheDocument()
  })

  it('sends search, page and archived filter query parameters', async () => {
    const user = userEvent.setup()
    const receivedQueries: string[] = []

    server.use(
      http.get('/api/decks', ({ request }) => {
        receivedQueries.push(new URL(request.url).search)
        return HttpResponse.json(deckPage([archivedDeck], { totalPages: 2, totalElements: 11 }))
      }),
    )

    renderDecksPage()
    await screen.findByText('SQL archivado')
    fireEvent.change(screen.getByLabelText('Buscar conjuntos'), { target: { value: 'sql' } })
    await user.click(screen.getByRole('tab', { name: 'Archivados' }))
    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))

    await waitFor(() => {
      expect(receivedQueries.some((query) => query.includes('search=sql'))).toBe(true)
      expect(receivedQueries.some((query) => query.includes('archived=true'))).toBe(true)
      expect(receivedQueries.some((query) => query.includes('page=1'))).toBe(true)
    })
  })
})
