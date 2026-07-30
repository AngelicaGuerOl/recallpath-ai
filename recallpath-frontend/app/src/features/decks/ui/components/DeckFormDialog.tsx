import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Deck, DeckFormInput } from '../../domain/entities/Deck'
import { deckSchema, type DeckFormValues, type NormalizedDeckFormValues } from '../schemas/deckSchema'

type DeckFormDialogProps = {
  open: boolean
  deck?: Deck | null
  loading?: boolean
  onClose(): void
  onSubmit(input: DeckFormInput): void
}

export function DeckFormDialog({ open, deck, loading = false, onClose, onSubmit }: DeckFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<DeckFormValues, unknown, NormalizedDeckFormValues>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: deck?.name ?? '',
        description: deck?.description ?? '',
      })
    }
  }, [deck, open, reset])

  const submit = handleSubmit((values) => onSubmit(values))

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{deck ? 'Editar conjunto' : 'Crear conjunto'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="deck-form" spacing={2.5} sx={{ pt: 1 }} onSubmit={submit}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
                label="Nombre"
                required
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
                label="Descripción"
                fullWidth
                multiline
                minRows={3}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? 'Opcional'}
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" disabled={loading} onClick={submit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
