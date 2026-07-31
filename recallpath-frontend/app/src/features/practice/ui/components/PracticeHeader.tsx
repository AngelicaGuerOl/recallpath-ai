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
}

export function PracticeHeader({ deckName, currentPosition, totalCards, completedCards, onCancel }: PracticeHeaderProps) {
  const progress = totalCards > 0 ? (completedCards / totalCards) * 100 : 0

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            Tarjeta {currentPosition} de {totalCards}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            {completedCards} de {totalCards} completadas
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ borderRadius: 1, height: 6 }} 
        />
      </Box>
    </Box>
  )
}
