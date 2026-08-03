import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/render'
import { MultipleChoiceCard } from './MultipleChoiceCard'
import type { PracticeSessionCard } from '../../domain/entities/Practice'

function makeCard(overrides: Partial<PracticeSessionCard> = {}): PracticeSessionCard {
  return {
    id: 1,
    position: 1,
    termSnapshot: 'Fotosíntesis',
    definitionSnapshot: 'Proceso por el que las plantas producen su propio alimento',
    categorySnapshot: 'Biología',
    difficultySnapshot: 'MEDIUM',
    answered: false,
    options: [
      { text: 'Proceso por el que las plantas producen su propio alimento', correct: true },
      { text: 'La fuerza que atrae los cuerpos hacia el centro de la Tierra', correct: false },
      { text: 'División del núcleo celular', correct: false },
      { text: 'Proteína que cataliza reacciones bioquímicas', correct: false },
    ],
    ...overrides,
  }
}

function renderCard(
  card = makeCard(),
  onResult: (r: 'CORRECT' | 'INCORRECT', userAnswer: string) => void = vi.fn(),
  disabled = false,
) {
  return renderWithProviders(<MultipleChoiceCard card={card} onResult={onResult} disabled={disabled} />)
}

describe('MultipleChoiceCard', () => {
  // ─── Renderizado inicial ──────────────────────────────────────────────────

  it('muestra el término como pregunta', () => {
    renderCard()
    expect(screen.getByText('Fotosíntesis')).toBeInTheDocument()
  })

  it('muestra exactamente 4 opciones', () => {
    renderCard()
    const options = screen.getAllByRole('radio', { name: /Proceso|fuerza|División|Proteína/i })
    expect(options).toHaveLength(4)
  })

  it('el botón Confirmar respuesta está deshabilitado antes de seleccionar', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /Confirmar respuesta/i })).toBeDisabled()
  })

  it('muestra la categoría cuando está disponible', () => {
    renderCard()
    expect(screen.getByText('Biología')).toBeInTheDocument()
  })

  // ─── Selección de opción ─────────────────────────────────────────────────

  it('el botón Confirmar respuesta se habilita tras seleccionar una opción', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByText('División del núcleo celular'))
    expect(screen.getByRole('button', { name: /Confirmar respuesta/i })).toBeEnabled()
  })

  it('se puede cambiar la respuesta antes de confirmar', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByText('División del núcleo celular'))
    let radio = screen.getByRole('radio', { name: /División del núcleo celular/i })
    expect(radio).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByText('Proteína que cataliza reacciones bioquímicas'))
    radio = screen.getByRole('radio', { name: /Proteína que cataliza reacciones bioquímicas/i })
    expect(radio).toHaveAttribute('aria-checked', 'true')
    
    // No next button should be shown yet
    expect(screen.queryByRole('button', { name: /Siguiente pregunta/i })).not.toBeInTheDocument()
  })

  it('no se puede cambiar la respuesta una vez confirmada', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    renderCard(makeCard(), onResult)

    await user.click(screen.getByText('División del núcleo celular'))
    await user.click(screen.getByRole('button', { name: /Confirmar respuesta/i }))

    expect(screen.getByRole('button', { name: /Siguiente pregunta/i })).toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()
  })

  // ─── Retroalimentación ───────────────────────────────────────────────────

  it('muestra el icono de correcto al confirmar la opción correcta', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(
      screen.getByText('Proceso por el que las plantas producen su propio alimento'),
    )
    await user.click(screen.getByRole('button', { name: /Confirmar respuesta/i }))
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument()
  })

  it('muestra el icono de incorrecto al confirmar una opción incorrecta y marca la correcta', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByText('División del núcleo celular'))
    await user.click(screen.getByRole('button', { name: /Confirmar respuesta/i }))
    
    // The selected wrong answer gets a cancel icon
    expect(screen.getByTestId('CancelIcon')).toBeInTheDocument()
    // The correct answer gets a check circle icon
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument()
  })

  // ─── Callback onResult ───────────────────────────────────────────────────

  it('llama onResult con CORRECT y la respuesta elegida al confirmar opción correcta', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    renderCard(makeCard(), onResult)

    await user.click(
      screen.getByText('Proceso por el que las plantas producen su propio alimento'),
    )
    await user.click(screen.getByRole('button', { name: /Confirmar respuesta/i }))
    await user.click(screen.getByRole('button', { name: /Siguiente pregunta/i }))

    expect(onResult).toHaveBeenCalledOnce()
    expect(onResult).toHaveBeenCalledWith('CORRECT', 'Proceso por el que las plantas producen su propio alimento')
  })

  it('llama onResult con INCORRECT y la respuesta elegida al confirmar opción incorrecta', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    renderCard(makeCard(), onResult)

    await user.click(screen.getByText('División del núcleo celular'))
    await user.click(screen.getByRole('button', { name: /Confirmar respuesta/i }))
    await user.click(screen.getByRole('button', { name: /Siguiente pregunta/i }))

    expect(onResult).toHaveBeenCalledOnce()
    expect(onResult).toHaveBeenCalledWith('INCORRECT', 'División del núcleo celular')
  })
})
