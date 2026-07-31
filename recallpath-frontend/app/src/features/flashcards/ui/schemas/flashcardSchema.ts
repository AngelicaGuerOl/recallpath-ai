import { z } from 'zod'

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const

export const flashcardSchema = z.object({
  term: z
    .string()
    .trim()
    .min(1, 'El término es obligatorio.')
    .max(255, 'El término no puede superar 255 caracteres.'),
  definition: z
    .string()
    .trim()
    .min(1, 'La definición es obligatoria.')
    .max(2000, 'La definición no puede superar 2000 caracteres.'),
  category: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value
      const normalized = value.trim()
      return normalized === '' ? null : normalized
    },
    z
      .string()
      .max(120, 'La categoría no puede superar 120 caracteres.')
      .nullable(),
  ),
  difficulty: z.enum(DIFFICULTIES, {
    error: 'Selecciona un nivel de dificultad.',
  }),
})

export type FlashcardFormValues = z.input<typeof flashcardSchema>
export type NormalizedFlashcardFormValues = z.output<typeof flashcardSchema>
