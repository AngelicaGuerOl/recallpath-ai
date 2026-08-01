import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import {
  activeDeck,
  archivedDeck,
  activeFlashcard,
  archivedFlashcard,
  flashcardList,
} from '../../../../test/deckTestData'
import { renderWithProviders } from '../../../../test/render'
import { server } from '../../../../test/server'
import { DeckDetailPage } from './DeckDetailPage'

const DECK_ID = activeDeck.id

/** Monta la página usando Routes/Route para que useParams funcione */
function renderPage(initialPath = `/decks/${DECK_ID}`) {
  return renderWithProviders(
    <Routes>
      <Route path="/decks/:deckId" element={<DeckDetailPage />} />
    </Routes>,
    { initialEntries: [initialPath] },
  )
}

/** Handler base: deck activo + flashcards vacías */
function useActiveDeckEmpty() {
  server.use(
    http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
    http.get(`/api/decks/${DECK_ID}/flashcards`, () => HttpResponse.json([])),
  )
}

/** Handler base: deck activo + lista de flashcards */
function useActiveDeckWithCards(cards = flashcardList()) {
  server.use(
    http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
    http.get(`/api/decks/${DECK_ID}/flashcards`, () => HttpResponse.json(cards)),
  )
}

/** Handler: deck archivado + una flashcard activa */
function useArchivedDeck() {
  server.use(
    http.get(`/api/decks/${archivedDeck.id}`, () => HttpResponse.json(archivedDeck)),
    http.get(`/api/decks/${archivedDeck.id}/flashcards`, () =>
      HttpResponse.json(flashcardList()),
    ),
  )
}

function getDialog() {
  return screen.getByRole('dialog')
}

// ─────────────────────────────────────────────
describe('DeckDetailPage', () => {
  // 1. Navegación
  it('muestra el botón para volver a Mis conjuntos', async () => {
    useActiveDeckEmpty()
    renderPage()
    expect(await screen.findByRole('button', { name: /Mis conjuntos/i })).toBeInTheDocument()
  })

  // 2. Estado vacío — nuevos textos
  it('muestra el estado vacío con los textos correctos cuando no hay tarjetas', async () => {
    useActiveDeckEmpty()
    renderPage()
    expect(await screen.findByText('Crea tu primera tarjeta')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Agrega términos y definiciones manualmente o genéralos más adelante desde un PDF.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0]).toBeInTheDocument()
  })

  // 3. Crear tarjeta — botón "Crear tarjeta" en el dialog
  it('crea una tarjeta correctamente y muestra snackbar de éxito', async () => {
    const user = userEvent.setup()
    let receivedBody: unknown

    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () => HttpResponse.json([])),
      http.post(`/api/decks/${DECK_ID}/flashcards`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(activeFlashcard, { status: 201 })
      }),
    )

    renderPage()
    await screen.findByText('Crea tu primera tarjeta')
    await user.click(screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0])

    const dialog = getDialog()
    // Título del dialog para crear
    expect(within(dialog).getByText('Nueva tarjeta')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText(/Término/), {
      target: { value: 'IoC Container' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Definición/), {
      target: { value: 'Gestiona beans en Spring.' },
    })
    // Botón de submit para crear
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarjeta' }))

    expect(await screen.findByText('Tarjeta creada correctamente.')).toBeInTheDocument()
    expect(receivedBody).toMatchObject({
      term: 'IoC Container',
      definition: 'Gestiona beans en Spring.',
    })
  })

  // 4. Validación de campos vacíos
  it('muestra errores de validación cuando los campos están vacíos', async () => {
    const user = userEvent.setup()
    useActiveDeckEmpty()
    renderPage()
    await screen.findByText('Crea tu primera tarjeta')

    await user.click(screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0])

    const dialog = getDialog()
    fireEvent.change(within(dialog).getByLabelText(/Término/), { target: { value: '' } })
    fireEvent.change(within(dialog).getByLabelText(/Definición/), { target: { value: '' } })
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarjeta' }))

    expect(await screen.findByText('El término es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La definición es obligatoria.')).toBeInTheDocument()
  })

  // 5. Editar tarjeta — título y botón distintos
  it('edita una tarjeta y muestra snackbar de éxito', async () => {
    const user = userEvent.setup()
    let receivedBody: unknown

    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () =>
        HttpResponse.json(flashcardList()),
      ),
      http.put(
        `/api/decks/${DECK_ID}/flashcards/${activeFlashcard.id}`,
        async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ ...activeFlashcard, term: 'DI Container' })
        },
      ),
    )

    renderPage()
    await screen.findByText(activeFlashcard.term)

    await user.click(
      screen.getByRole('button', { name: `Opciones de ${activeFlashcard.term}` }),
    )
    await user.click(screen.getByRole('menuitem', { name: /Editar/i }))

    const dialog = getDialog()
    // Título del dialog para editar
    expect(within(dialog).getByText('Editar tarjeta')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText(/Término/), {
      target: { value: 'DI Container' },
    })
    // Botón de submit para editar
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Tarjeta actualizada correctamente.')).toBeInTheDocument()
    expect(receivedBody).toMatchObject({ term: 'DI Container' })
  })

  // 6. Archivar tarjeta
  it('archiva una tarjeta tras confirmación y muestra snackbar', async () => {
    const user = userEvent.setup()
    let archived = false

    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () =>
        HttpResponse.json(flashcardList()),
      ),
      http.patch(
        `/api/decks/${DECK_ID}/flashcards/${activeFlashcard.id}/archive`,
        () => {
          archived = true
          return HttpResponse.json({ ...activeFlashcard, status: 'ARCHIVED' })
        },
      ),
    )

    renderPage()
    await screen.findByText(activeFlashcard.term)

    await user.click(
      screen.getByRole('button', { name: `Opciones de ${activeFlashcard.term}` }),
    )
    await user.click(screen.getByRole('menuitem', { name: /Archivar/i }))

    const confirmDialog = screen.getByRole('dialog', { name: 'Archivar tarjeta' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Archivar' }))

    expect(await screen.findByText('Tarjeta archivada correctamente.')).toBeInTheDocument()
    expect(archived).toBe(true)
  })

  // 7. Restaurar tarjeta
  it('restaura una tarjeta archivada y muestra snackbar', async () => {
    const user = userEvent.setup()
    let restored = false

    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () =>
        HttpResponse.json(flashcardList([archivedFlashcard])),
      ),
      http.patch(
        `/api/decks/${DECK_ID}/flashcards/${archivedFlashcard.id}/restore`,
        () => {
          restored = true
          return HttpResponse.json({ ...archivedFlashcard, status: 'ACTIVE' })
        },
      ),
    )

    renderPage()
    await screen.findByText(archivedFlashcard.term)

    await user.click(
      screen.getByRole('button', { name: `Opciones de ${archivedFlashcard.term}` }),
    )
    await user.click(screen.getByRole('menuitem', { name: /Restaurar/i }))

    expect(await screen.findByText('Tarjeta restaurada correctamente.')).toBeInTheDocument()
    expect(restored).toBe(true)
  })

  // 8. Conjunto archivado en modo lectura
  it('muestra modo lectura cuando el conjunto está archivado', async () => {
    useArchivedDeck()
    renderPage(`/decks/${archivedDeck.id}`)

    expect(
      await screen.findByText(
        /Este conjunto está archivado\. Puedes ver las tarjetas, pero no editarlas\./i,
      ),
    ).toBeInTheDocument()

    // Botón Agregar tarjeta deshabilitado
    const addBtn = screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0]
    expect(addBtn).toBeDisabled()

    // Botón Iniciar práctica también deshabilitado (deck archivado)
    const practiceBtn = screen.getByRole('button', { name: /Iniciar práctica/i })
    expect(practiceBtn).toBeDisabled()
  })

  // 9. Error de API — flashcards
  it('muestra error y botón Reintentar si la API falla al cargar flashcards', async () => {
    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () =>
        HttpResponse.json({ message: 'Service unavailable' }, { status: 500 }),
      ),
    )
    renderPage()

    expect(await screen.findByText('No fue posible cargar las tarjetas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  // 10. Practicar deshabilitado sin tarjetas activas
  it('muestra el botón Practicar deshabilitado cuando no hay tarjetas', async () => {
    useActiveDeckEmpty()
    renderPage()

    await screen.findByText('Crea tu primera tarjeta')

    const practiceBtn = screen.getByRole('button', { name: /Iniciar práctica/i })
    expect(practiceBtn).toBeDisabled()
  })

  // 11. Practicar habilitado con al menos 1 tarjeta activa
  it('habilita el botón Practicar cuando hay al menos 1 tarjeta activa', async () => {
    useActiveDeckWithCards([activeFlashcard]) // 1 tarjeta activa
    renderPage()

    await screen.findByText(activeFlashcard.term)

    const practiceBtn = screen.getByRole('button', { name: /Iniciar práctica/i })
    expect(practiceBtn).not.toBeDisabled()
  })

  // 12. Practicar deshabilitado si solo hay tarjetas archivadas (0 activas)
  it('mantiene Practicar deshabilitado cuando todas las tarjetas están archivadas', async () => {
    useActiveDeckWithCards([archivedFlashcard]) // 0 activas
    renderPage()

    await screen.findByText(archivedFlashcard.term)

    const practiceBtn = screen.getByRole('button', { name: /Iniciar práctica/i })
    expect(practiceBtn).toBeDisabled()
  })

  // 13. Skeletons durante carga
  it('muestra skeletons durante la carga de flashcards', () => {
    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, async () => {
        await delay(200)
        return HttpResponse.json([])
      }),
    )
    renderPage()
    expect(screen.getAllByLabelText('Cargando tarjeta').length).toBeGreaterThan(0)
  })

  // 14. Tarjetas con todos los datos — etiqueta Intermedia (MEDIUM)
  it('muestra las tarjetas con término, definición, categoría y dificultad', async () => {
    useActiveDeckWithCards()
    renderPage()

    expect(await screen.findByText(activeFlashcard.term)).toBeInTheDocument()
    expect(screen.getByText(activeFlashcard.definition)).toBeInTheDocument()
    expect(screen.getByText('Biology')).toBeInTheDocument()       // categoría
    expect(screen.getByText('Intermedia')).toBeInTheDocument() // MEDIUM → Intermedia
  })

  // 15. Error backend en mutación — dialog permanece abierto
  it('muestra error del backend al crear una tarjeta con término duplicado', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () => HttpResponse.json([])),
      http.post(`/api/decks/${DECK_ID}/flashcards`, () =>
        HttpResponse.json(
          { message: 'Ya existe una tarjeta con ese término.' },
          { status: 409 },
        ),
      ),
    )

    renderPage()
    await screen.findByText('Crea tu primera tarjeta')
    await user.click(screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0])

    const dialog = getDialog()
    fireEvent.change(within(dialog).getByLabelText(/Término/), {
      target: { value: 'IoC Container' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Definición/), {
      target: { value: 'Algo' },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarjeta' }))

    const openDialog = getDialog()
    expect(
      await within(openDialog).findByText('Ya existe una tarjeta con ese término.'),
    ).toBeInTheDocument()
  })

  // 16. Pluralización — 1 tarjeta activa
  it('muestra "1 tarjeta activa" cuando hay exactamente 1 tarjeta activa', async () => {
    useActiveDeckWithCards([activeFlashcard, archivedFlashcard])
    renderPage()

    expect(await screen.findByText('1 tarjeta activa')).toBeInTheDocument()
  })

  // 17. Pluralización — 0 tarjetas activas
  it('muestra "0 tarjetas activas" cuando no hay tarjetas activas', async () => {
    useActiveDeckWithCards([archivedFlashcard])
    renderPage()

    expect(await screen.findByText('0 tarjetas activas')).toBeInTheDocument()
  })

  // 18. Pluralización — 2 tarjetas activas
  it('muestra "2 tarjetas activas" cuando hay 2 tarjetas activas', async () => {
    const secondActive = { ...activeFlashcard, id: 99, term: 'Otra tarjeta' }
    useActiveDeckWithCards([activeFlashcard, secondActive, archivedFlashcard])
    renderPage()

    expect(await screen.findByText('2 tarjetas activas')).toBeInTheDocument()
  })

  // 19. Loading durante mutación — botón muestra spinner (deshabilitado)
  it('deshabilita el botón de submit durante la mutación', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () => HttpResponse.json([])),
      http.post(`/api/decks/${DECK_ID}/flashcards`, async () => {
        await delay(500)
        return HttpResponse.json(activeFlashcard, { status: 201 })
      }),
    )

    renderPage()
    await screen.findByText('Crea tu primera tarjeta')
    await user.click(screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0])

    const dialog = getDialog()
    fireEvent.change(within(dialog).getByLabelText(/Término/), {
      target: { value: 'IoC Container' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Definición/), {
      target: { value: 'Gestiona beans.' },
    })

    await user.click(within(dialog).getByRole('button', { name: 'Crear tarjeta' }))

    // Inmediatamente después del click el botón debe estar deshabilitado
    const submitBtn = within(dialog).getByRole('button', { name: /Crear tarjeta/i })
    expect(submitBtn).toBeDisabled()
  })

  // 20. Invalidación: lista se refresca tras crear tarjeta
  it('invalida la lista de flashcards al crear una tarjeta', async () => {
    const user = userEvent.setup()
    let listRequests = 0

    server.use(
      http.get(`/api/decks/${DECK_ID}`, () => HttpResponse.json(activeDeck)),
      http.get(`/api/decks/${DECK_ID}/flashcards`, () => {
        listRequests += 1
        return HttpResponse.json([])
      }),
      http.post(`/api/decks/${DECK_ID}/flashcards`, () =>
        HttpResponse.json(activeFlashcard, { status: 201 }),
      ),
    )

    renderPage()
    await screen.findByText('Crea tu primera tarjeta')
    await user.click(screen.getAllByRole('button', { name: 'Agregar tarjeta' })[0])

    const dialog = getDialog()
    fireEvent.change(within(dialog).getByLabelText(/Término/), {
      target: { value: 'IoC Container' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Definición/), {
      target: { value: 'Gestiona beans.' },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarjeta' }))

    await screen.findByText('Tarjeta creada correctamente.')
    await waitFor(() => expect(listRequests).toBeGreaterThan(1))
  })
})
