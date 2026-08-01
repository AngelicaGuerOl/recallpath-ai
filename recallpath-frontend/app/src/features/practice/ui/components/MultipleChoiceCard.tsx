import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { PracticeSessionCard } from '../../domain/entities/Practice'

type MultipleChoiceCardProps = {
  card: PracticeSessionCard
  onResult(result: 'CORRECT' | 'INCORRECT', userAnswer: string): void
  disabled: boolean
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export function MultipleChoiceCard({ card, onResult, disabled }: MultipleChoiceCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const options = card.options ?? []

  const [prevCardId, setPrevCardId] = useState(card.id)

  if (card.id !== prevCardId) {
    setPrevCardId(card.id)
    setSelectedIndex(null)
    setIsConfirmed(false)
  }

  function handleSelect(index: number) {
    if (isConfirmed || disabled) return
    setSelectedIndex(index)
  }

  function handleConfirm() {
    if (selectedIndex === null || isConfirmed || disabled) return
    setIsConfirmed(true)
  }

  function handleNext() {
    if (selectedIndex === null) return
    const chosen = options[selectedIndex]
    onResult(chosen.correct ? 'CORRECT' : 'INCORRECT', chosen.text)
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 750, mx: 'auto' }}>
      {/* Pregunta */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.0, md: 2.3 },
          borderRadius: '20px',
          mb: 3,
          textAlign: 'center',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="subtitle2"
          color="primary"
          sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}
        >
          Selecciona la definición correcta
        </Typography>
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontWeight: 700,
            wordBreak: 'break-word',
            lineHeight: 1.15,
            fontSize: 'clamp(1.1rem, 1.7vw, 2.1rem)',
            mb: card.categorySnapshot ? 1.5 : 0
          }}
        >
          {card.termSnapshot}
        </Typography>
        {card.categorySnapshot && (
          <Chip label={card.categorySnapshot} size="small" variant="outlined" sx={{ opacity: 0.8 }} />
        )}
      </Paper>

      {/* Opciones */}
      <Stack spacing={1.5} sx={{ mb: 4 }} role="radiogroup" aria-label="Opciones">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index
          let stateStyles = {}
          let startIcon = (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isSelected && !isConfirmed ? 'primary.main' : 'grey.200',
                color: isSelected && !isConfirmed ? 'white' : 'text.primary',
                fontSize: '0.85rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {OPTION_LABELS[index]}
            </Box>
          )

          if (isConfirmed) {
            if (option.correct) {
              stateStyles = {
                bgcolor: 'success.50',
                borderColor: 'success.main',
                color: 'success.dark',
                '&.Mui-disabled': { bgcolor: 'success.50', borderColor: 'success.main', color: 'success.dark' },
              }
              startIcon = <CheckCircleIcon color="success" />
            } else if (isSelected) {
              stateStyles = {
                bgcolor: 'error.50',
                borderColor: 'error.main',
                color: 'error.dark',
                '&.Mui-disabled': { bgcolor: 'error.50', borderColor: 'error.main', color: 'error.dark' },
              }
              startIcon = <CancelIcon color="error" />
            } else {
              stateStyles = {
                opacity: 0.7,
              }
            }
          } else if (isSelected) {
            stateStyles = {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            }
          }

          return (
            <Button
              key={index}
              id={`mc-option-${index}`}
              variant="outlined"
              size="large"
              disabled={disabled || isConfirmed}
              onClick={() => handleSelect(index)}
              startIcon={startIcon}
              role="radio"
              aria-checked={isSelected}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                borderRadius: '12px',
                px: 3,
                py: 1.75,
                fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)',
                fontWeight: 400,
                lineHeight: 1.45,
                transition: 'all 0.2s ease',
                color: 'text.primary',
                borderColor: 'divider',
                textTransform: 'none',
                ...stateStyles,
                '&:hover': !isConfirmed && !disabled ? {
                  borderColor: isSelected ? 'primary.main' : 'text.secondary',
                  bgcolor: isSelected ? 'primary.50' : 'transparent',
                } : {},
              }}
            >
              {option.text}
            </Button>
          )
        })}
      </Stack>

      {/* Retroalimentación + botón Confirmar/Siguiente */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isConfirmed && (
          <Box
            aria-live="polite"
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: options[selectedIndex!]?.correct ? 'success.50' : 'error.50',
              border: 1,
              borderColor: options[selectedIndex!]?.correct ? 'success.200' : 'error.200',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            {options[selectedIndex!]?.correct ? (
              <CheckCircleIcon color="success" sx={{ flexShrink: 0, mt: 0.25 }} />
            ) : (
              <CancelIcon color="error" sx={{ flexShrink: 0, mt: 0.25 }} />
            )}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: options[selectedIndex!]?.correct ? 'success.dark' : 'error.dark',
                  mb: 0.5,
                }}
              >
                {options[selectedIndex!]?.correct ? '¡Correcto!' : 'Todavía no.'}
              </Typography>
              {!options[selectedIndex!]?.correct && (
                <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                  Tu respuesta:<br />
                  <span style={{ color: 'var(--mui-palette-error-main)' }}>{options[selectedIndex!]?.text}</span>
                  <br /><br />
                  Respuesta correcta:<br />
                  <span style={{ color: 'var(--mui-palette-success-main)', fontWeight: 600 }}>{options.find((o) => o.correct)?.text}</span>
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!isConfirmed ? (
            <Button
              variant="contained"
              size="large"
              disabled={selectedIndex === null || disabled}
              onClick={handleConfirm}
              sx={{ borderRadius: '12px', px: 4, minWidth: 140 }}
            >
              Confirmar respuesta
            </Button>
          ) : (
            <Button
              id="mc-next-button"
              variant="contained"
              size="large"
              disabled={disabled}
              onClick={handleNext}
              sx={{ borderRadius: '12px', px: 4, minWidth: 140 }}
            >
              Siguiente pregunta
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}
