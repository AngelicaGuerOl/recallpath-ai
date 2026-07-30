import { z } from 'zod'

export const deckSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),
  description: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value
      const normalized = value.trim()
      return normalized === '' ? null : normalized
    },
    z.string().max(500, 'La descripción no puede superar 500 caracteres.').nullable(),
  ),
})

export type DeckFormValues = z.input<typeof deckSchema>
export type NormalizedDeckFormValues = z.output<typeof deckSchema>
