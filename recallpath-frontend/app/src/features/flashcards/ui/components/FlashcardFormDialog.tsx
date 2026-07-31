import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Flashcard, FlashcardFormInput } from '../../domain/entities/Flashcard'
import {
  flashcardSchema,
  type FlashcardFormValues,
  type NormalizedFlashcardFormValues,
} from '../schemas/flashcardSchema'

type FlashcardFormDialogProps = {
  open: boolean
  card?: Flashcard | null
  loading?: boolean
  serverError?: string | null
  onClose(): void
  onSubmit(input: FlashcardFormInput): void
}

/**
 * Etiquetas visibles de dificultad → valores internos del backend sin cambiar.
 * EASY / MEDIUM / HARD son los valores que envía la API.
 */
const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: 'EASY', label: 'Básica' },
  { value: 'MEDIUM', label: 'Intermedia' },
  { value: 'HARD', label: 'Avanzada' },
]

export function FlashcardFormDialog({
  open,
  card,
  loading = false,
  serverError,
  onClose,
  onSubmit,
}: FlashcardFormDialogProps) {
  const termRef = useRef<HTMLInputElement>(null)
  const { control, handleSubmit, reset } = useForm<
    FlashcardFormValues,
    unknown,
    NormalizedFlashcardFormValues
  >({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      term: '',
      definition: '',
      category: '',
      difficulty: 'MEDIUM',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        term: card?.term ?? '',
        definition: card?.definition ?? '',
        category: card?.category ?? '',
        difficulty: card?.difficulty ?? 'MEDIUM',
      })
      // Autofocus en el campo Término al abrir
      requestAnimationFrame(() => termRef.current?.focus())
    }
  }, [card, open, reset])

  const submit = handleSubmit((values) => onSubmit(values as FlashcardFormInput))

  const isEditing = Boolean(card)
  const dialogTitle = isEditing ? 'Editar tarjeta' : 'Nueva tarjeta'
  const submitLabel = isEditing ? 'Guardar cambios' : 'Crear tarjeta'

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="flashcard-form" spacing={2.5} sx={{ pt: 1 }} onSubmit={submit}>
          <Controller
            name="term"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                inputRef={termRef}
                label="Término"
                required
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: 255 } }}
                disabled={loading}
              />
            )}
          />
          <Controller
            name="definition"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Definición"
                required
                fullWidth
                multiline
                minRows={3}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
                disabled={loading}
              />
            )}
          />
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
                label="Categoría (opcional)"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: 120 } }}
                disabled={loading}
              />
            )}
          />
          <Controller
            name="difficulty"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)} disabled={loading}>
                <InputLabel id="difficulty-label" required>
                  Dificultad
                </InputLabel>
                <Select
                  {...field}
                  labelId="difficulty-label"
                  label="Dificultad"
                  inputProps={{ 'aria-label': 'Dificultad' }}
                >
                  {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error ? (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                ) : null}
              </FormControl>
            )}
          />
          {serverError ? (
            <FormHelperText error sx={{ mt: 1 }}>
              {serverError}
            </FormHelperText>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={submit}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
