import { Box, Button, Paper, Typography } from '@mui/material'
import type { PracticeSessionCard } from '../../domain/entities/Practice'
import { useEffect } from 'react'

type PracticeCardProps = {
  card: PracticeSessionCard
  isFlipped: boolean
  onFlip(): void
}

export function PracticeCard({ card, isFlipped, onFlip }: PracticeCardProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isFlipped) return
      // Ignore if user is typing in an input (though there shouldn't be any here)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'Space') {
        e.preventDefault()
        onFlip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFlipped, onFlip])

  return (
    <Box sx={{ width: '100%', maxWidth: 750, mx: 'auto' }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: '24px',
          textAlign: 'center',
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.paper',
          cursor: !isFlipped ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': !isFlipped ? {
            boxShadow: 4,
          } : {},
        }}
        onClick={!isFlipped ? onFlip : undefined}
      >
        <Typography
          variant="h3"
          component="div"
          sx={{
            wordBreak: 'break-word',
            fontWeight: 500,
            mb: isFlipped ? 4 : 0,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          {card.termSnapshot}
        </Typography>

        {isFlipped ? (
          <Box sx={{ width: '100%', animation: 'fadeIn 0.3s ease-in' }}>
            <Box sx={{ width: '100%', height: '1px', bgcolor: 'divider', mb: 4 }} />
            <div aria-live="polite">
              <Typography
                variant="h4"
                component="div"
                sx={{
                  wordBreak: 'break-word',
                  fontWeight: 400,
                  color: 'text.secondary',
                  fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
                  lineHeight: 1.5
                }}
              >
                {card.definitionSnapshot}
              </Typography>
            </div>
          </Box>
        ) : (
          <Button
            variant="outlined"
            size="large"
            onClick={(e) => {
              e.stopPropagation()
              onFlip()
            }}
            sx={{ mt: 6, borderRadius: 8, px: 4 }}
          >
            Mostrar respuesta (Espacio)
          </Button>
        )}
      </Paper>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  )
}
