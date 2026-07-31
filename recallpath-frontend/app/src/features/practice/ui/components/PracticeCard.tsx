import { Box, Button, Paper, Typography } from '@mui/material'
import type { PracticeSessionCard } from '../../domain/entities/Practice'

type PracticeCardProps = {
  card: PracticeSessionCard
  isFlipped: boolean
  onFlip(): void
}

export function PracticeCard({ card, isFlipped, onFlip }: PracticeCardProps) {
  return (
    <Box
      sx={{
        perspective: '1000px',
        width: '100%',
        maxWidth: 750,
        minHeight: 400,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          position: 'relative',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Front (Term) */}
        <Paper
          elevation={isFlipped ? 0 : 3}
          sx={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            borderRadius: '24px',
            textAlign: 'center',
            bgcolor: 'background.paper',
            opacity: isFlipped ? 0 : 1, // Fallback for browsers with poor backface-visibility support
            pointerEvents: isFlipped ? 'none' : 'auto',
          }}
        >
          <Typography variant="h3" component="div" sx={{ wordBreak: 'break-word', fontWeight: 500, mb: 4 }}>
            {card.termSnapshot}
          </Typography>
          
          <Button 
            variant="outlined" 
            size="large" 
            onClick={onFlip}
            sx={{ mt: 'auto', borderRadius: 8, px: 4 }}
          >
            Mostrar respuesta
          </Button>
        </Paper>

        {/* Back (Definition) */}
        <Paper
          elevation={isFlipped ? 3 : 0}
          sx={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            borderRadius: '24px',
            textAlign: 'center',
            bgcolor: 'background.paper',
            transform: 'rotateX(180deg)',
            opacity: isFlipped ? 1 : 0,
            pointerEvents: isFlipped ? 'auto' : 'none',
          }}
        >
          <Typography variant="h5" component="div" color="text.secondary" sx={{ mb: 2, fontSize: '1rem' }}>
            {card.termSnapshot}
          </Typography>
          <Typography variant="h4" component="div" sx={{ wordBreak: 'break-word', fontWeight: 400 }}>
            {card.definitionSnapshot}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
