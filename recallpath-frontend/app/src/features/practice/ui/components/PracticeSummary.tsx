import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle'
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { usePracticeSummary } from '../hooks/usePractice'

type PracticeSummaryProps = {
  sessionId: number
  deckId: number
}

export function PracticeSummary({ sessionId, deckId }: PracticeSummaryProps) {
  const navigate = useNavigate()
  const { data: summary, isLoading, isError } = usePracticeSummary(sessionId, true)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !summary) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography color="error">No se pudo cargar el resumen de la sesión.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate(`/decks/${deckId}`)}>
          Volver al conjunto
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          ¡Sesión completada!
        </Typography>
        
        <Stack spacing={2} sx={{ mt: 4, mb: 4, textAlign: 'left' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Total de tarjetas</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{summary.totalCards}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Fáciles</Typography>
            <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>{summary.easyCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Correctas</Typography>
            <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>{summary.correctCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Difíciles</Typography>
            <Typography sx={{ fontWeight: 'bold', color: 'warning.main' }}>{summary.difficultCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">No recordadas</Typography>
            <Typography sx={{ fontWeight: 'bold', color: 'error.main' }}>{summary.incorrectCount}</Typography>
          </Box>
          
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Precisión</Typography>
            <Typography variant="h6">{summary.accuracyPercentage}%</Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => navigate(`/decks/${deckId}`)}>
            Volver al conjunto
          </Button>
          {/* Practice again button can be implemented later, for now we just go back */}
        </Stack>
      </Paper>
    </Box>
  )
}
