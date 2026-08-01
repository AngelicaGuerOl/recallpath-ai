import ReplayIcon from '@mui/icons-material/Replay'
import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useNavigate } from 'react-router-dom'
import { usePracticeSummary } from '../hooks/usePractice'
import { useStartPracticeSession } from '../hooks/usePracticeMutations'
import { useState } from 'react'
import { getErrorMessage } from '../../../../shared/api/apiError'

type MultipleChoiceSummaryProps = {
  sessionId: number
  deckId: number
  mode: 'MULTIPLE_CHOICE' | 'WRITTEN_RESPONSE'
}

function getFeedbackMessage(accuracy: number) {
  if (accuracy >= 80) return 'Muy buen dominio.'
  if (accuracy >= 50) return 'Vas por buen camino.'
  return 'Este intento te ayudó a identificar qué conceptos debes reforzar.'
}

export function MultipleChoiceSummary({ sessionId, deckId, mode }: MultipleChoiceSummaryProps) {
  const navigate = useNavigate()
  const { data: summary, isLoading, isError } = usePracticeSummary(sessionId, true)
  const startPractice = useStartPracticeSession()
  const [retryError, setRetryError] = useState<string | null>(null)

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

  const accuracy = summary.accuracyPercentage
  const feedbackMsg = getFeedbackMessage(accuracy)

  async function handleRetryIncorrect() {
    try {
      setRetryError(null)
      const session = await startPractice.mutateAsync({
        deckId,
        mode,
        incorrectOnly: true,
        sourceSessionId: sessionId,
      })
      navigate(`/practice/${session.id}`)
    } catch (error) {
      setRetryError(getErrorMessage(error))
    }
  }

  async function handleRetryAll() {
    try {
      setRetryError(null)
      const session = await startPractice.mutateAsync({
        deckId,
        mode,
      })
      navigate(`/practice/${session.id}`)
    } catch (error) {
      setRetryError(getErrorMessage(error))
    }
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        Resultados de la práctica
      </Typography>

      {/* Score principal */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: '24px',
          textAlign: 'center',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          mb: 4,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
          {summary.correctCount} de {summary.totalCards} correctas
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
          {accuracy}% de precisión
        </Typography>
        {summary.incorrectCount > 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hay {summary.incorrectCount} {summary.incorrectCount === 1 ? 'concepto que necesita' : 'conceptos que necesitan'} repaso.
          </Typography>
        )}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {feedbackMsg}
        </Typography>
      </Paper>

      {/* Desglose */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: '20px', mb: 4, border: 1, borderColor: 'divider' }}
      >
        <Stack spacing={1.5}>
          <StatRow label="Correctas" value={summary.correctCount} color="success.main" />
          <StatRow label="Incorrectas" value={summary.incorrectCount} color="error.main" />
          <Divider />
          <StatRow label="Total" value={summary.totalCards} />
        </Stack>
      </Paper>

      {/* Lista de errores */}
      {summary.incorrectCards.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Errores para repasar
          </Typography>
          <Stack spacing={2}>
            {summary.incorrectCards.map((card, i) => (
              <Accordion 
                key={i} 
                defaultExpanded={i === 0}
                elevation={0}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  '&:before': { display: 'none' },
                  borderRadius: '12px !important'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {card.term}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                  {card.userAnswer && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Tu respuesta
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'error.dark', textDecoration: 'line-through' }}>
                        {card.userAnswer}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      Respuesta correcta
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 500 }}>
                      {card.definition}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      )}

      {/* Error de reintento */}
      {retryError && (
        <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
          {retryError}
        </Typography>
      )}

      {/* Acciones */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center', mb: 6 }}>
        {summary.incorrectCards.length > 0 && (
          <Button
            id="retry-incorrect-button"
            variant="contained"
            size="large"
            startIcon={<ReplayIcon />}
            disabled={startPractice.isPending}
            onClick={handleRetryIncorrect}
            sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
          >
            {startPractice.isPending ? 'Iniciando…' : `Repasar ${summary.incorrectCards.length} errores`}
          </Button>
        )}
        
        <Button
          variant={summary.incorrectCards.length > 0 ? "outlined" : "contained"}
          size="large"
          disabled={startPractice.isPending}
          onClick={handleRetryAll}
          sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
        >
          Practicar de nuevo
        </Button>

        <Button
          variant="text"
          size="large"
          onClick={() => navigate(`/decks/${deckId}`)}
          sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
        >
          Volver al conjunto
        </Button>
      </Stack>
    </Box>
  )
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: 700, color: color ?? 'text.primary' }}>{value}</Typography>
    </Box>
  )
}
