import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Box,
  Button,
  LinearProgress,
  Typography,
} from '@mui/material'

type PracticeHeaderProps = {
  deckName: string
  currentPosition: number
  totalCards: number
  completedCards: number
  onCancel(): void
  mode?: 'FLASHCARDS' | 'MULTIPLE_CHOICE' | 'WRITTEN_RESPONSE'
}

export function PracticeHeader({ deckName, currentPosition, totalCards, completedCards, onCancel, mode = 'FLASHCARDS' }: PracticeHeaderProps) {
  const progress = totalCards > 0 ? (completedCards / totalCards) * 100 : 0
  const isMultipleChoice = mode === 'MULTIPLE_CHOICE'
  const isWrittenResponse = mode === 'WRITTEN_RESPONSE'
  const itemName = isMultipleChoice || isWrittenResponse ? 'Pregunta' : 'Tarjeta'

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2, pt: 2, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={onCancel}
          color="inherit"
          sx={{ mb: 2, opacity: 0.8 }}
        >
          Salir de la práctica
        </Button>
        
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          {deckName}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 'bold', mb: 0.5 }}>
              {isMultipleChoice ? 'OPCIÓN MÚLTIPLE' : isWrittenResponse ? 'RESPUESTA ESCRITA' : 'TARJETAS'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
              {itemName} {currentPosition} de {totalCards}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            {completedCards} respondidas
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ borderRadius: 1, height: 6 }} 
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de la sesión"
        />
      </Box>
    </Box>
  )
}
