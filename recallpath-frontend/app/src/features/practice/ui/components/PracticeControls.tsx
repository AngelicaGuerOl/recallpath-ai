import { Box, Button, Stack, Typography } from '@mui/material'
import { useEffect } from 'react'
import type { PracticeResult } from '../../domain/entities/Practice'

type PracticeControlsProps = {
  visible: boolean
  disabled: boolean
  onResult(result: PracticeResult): void
}

const RESULT_BUTTONS: { 
  label: string; 
  value: PracticeResult; 
  color: 'error' | 'warning' | 'success' | 'primary';
  desc: string;
  key: string;
}[] = [
  { label: 'Otra vez', value: 'INCORRECT', color: 'error', desc: 'No la recordé', key: '1' },
  { label: 'Difícil', value: 'DIFFICULT', color: 'warning', desc: 'La recordé con esfuerzo', key: '2' },
  { label: 'Bien', value: 'CORRECT', color: 'success', desc: 'La recordé correctamente', key: '3' },
  { label: 'Fácil', value: 'EASY', color: 'primary', desc: 'La recordé inmediatamente', key: '4' },
]

export function PracticeControls({ visible, disabled, onResult }: PracticeControlsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!visible || disabled) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const btn = RESULT_BUTTONS.find(b => b.key === e.key)
      if (btn) {
        e.preventDefault()
        onResult(btn.value)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, disabled, onResult])

  if (!visible) return null

  return (
    <Stack spacing={3} sx={{ mt: 4, width: '100%', maxWidth: 750, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="subtitle1" color="text.secondary">
        ¿Qué tan bien lo recordaste? (Atajos: 1-4)
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
        {RESULT_BUTTONS.map((btn) => (
          <Button
            key={btn.value}
            variant="outlined"
            color={btn.color}
            size="large"
            disabled={disabled}
            onClick={() => onResult(btn.value)}
            aria-label={`${btn.label}: ${btn.desc}`}
            sx={{ 
              flex: 1, 
              py: 2, 
              borderRadius: 3, 
              display: 'flex', 
              flexDirection: 'column',
              gap: 0.5,
              borderWidth: 2,
              '&:hover': { borderWidth: 2 }
            }}
          >
            <Box sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{btn.label}</Box>
            <Box sx={{ fontSize: '0.75rem', textTransform: 'none', opacity: 0.8 }}>{btn.desc}</Box>
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
