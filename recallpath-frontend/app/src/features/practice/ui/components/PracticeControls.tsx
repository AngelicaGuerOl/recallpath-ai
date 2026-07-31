import { Button, Stack, Typography } from '@mui/material'
import type { PracticeResult } from '../../domain/entities/Practice'

type PracticeControlsProps = {
  visible: boolean
  disabled: boolean
  onResult(result: PracticeResult): void
}

const RESULT_BUTTONS: { label: string; value: PracticeResult; color: 'error' | 'warning' | 'success' | 'primary' }[] = [
  { label: 'No la recordé', value: 'INCORRECT', color: 'error' },
  { label: 'Difícil', value: 'DIFFICULT', color: 'warning' },
  { label: 'Correcta', value: 'CORRECT', color: 'success' },
  { label: 'Fácil', value: 'EASY', color: 'primary' },
]

export function PracticeControls({ visible, disabled, onResult }: PracticeControlsProps) {
  if (!visible) return null

  return (
    <Stack spacing={2} sx={{ mt: 4, width: '100%', maxWidth: 750, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="subtitle1" color="text.secondary">
        ¿Qué tan bien lo recordaste?
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
        {RESULT_BUTTONS.map((btn) => (
          <Button
            key={btn.value}
            variant="contained"
            color={btn.color}
            size="large"
            disabled={disabled}
            onClick={() => onResult(btn.value)}
            sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
          >
            {btn.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
