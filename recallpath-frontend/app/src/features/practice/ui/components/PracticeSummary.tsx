import ReplayIcon from '@mui/icons-material/Replay'
import { Box, Button, CircularProgress, Divider, Paper, Stack, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useNavigate } from 'react-router-dom'
import { usePracticeSummary } from '../hooks/usePractice'
import { useStartPracticeSession } from '../hooks/usePracticeMutations'
import { useState } from 'react'
import { getErrorMessage } from '../../../../shared/api/apiError'

type PracticeSummaryProps = {
  sessionId: number
  deckId: number
}

function getFeedbackMessage(accuracy: number) {
  if (accuracy >= 80) return 'Muy buen dominio.'
  if (accuracy >= 50) return 'Vas por buen camino.'
  return 'Este intento te ayudó a identificar qué conceptos debes reforzar.'
}

export function PracticeSummary({ sessionId, deckId }: PracticeSummaryProps) {
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

  // In traditional mode, "Otra vez" and "Difícil" are considered "incorrect" in the backend stats
  // and they are added to incorrectCards.
  const cardsToRetryCount = summary.incorrectCount + summary.difficultCount

  async function handleRetryWeak() {
    try {
      setRetryError(null)
      const session = await startPractice.mutateAsync({
        deckId,
        mode: 'FLASHCARDS',
        incorrectOnly: true, // El backend deberá tratar incorrectOnly como "Otra vez" o "Difícil" para flashcards
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
        mode: 'FLASHCARDS',
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
          {summary.totalCards} revisadas
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
          {accuracy}% de precisión general
        </Typography>
        {cardsToRetryCount > 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hay {cardsToRetryCount} {cardsToRetryCount === 1 ? 'concepto que necesita' : 'conceptos que necesitan'} repaso.
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
          <StatRow label="Fácil" value={summary.easyCount} color="primary.main" />
          <StatRow label="Bien" value={summary.correctCount} color="success.main" />
          <StatRow label="Difícil" value={summary.difficultCount} color="warning.main" />
          <StatRow label="Otra vez" value={summary.incorrectCount} color="error.main" />
          <Divider />
          <StatRow label="Total revisado" value={summary.totalCards} />
        </Stack>
      </Paper>

      {/* Lista de errores */}
      {summary.incorrectCards.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Conceptos por repasar
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
                <AccordionDetails sx={{ bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {card.userAnswer && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        TU RESPUESTA:
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        {card.userAnswer}
                      </Typography>
                    </Box>
                  )}
                  {card.feedback && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        FEEDBACK DE LA IA:
                      </Typography>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                        {card.feedback}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      DEFINICIÓN DE REFERENCIA:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
        {cardsToRetryCount > 0 && (
          <Button
            id="retry-incorrect-button"
            variant="contained"
            size="large"
            startIcon={<ReplayIcon />}
            disabled={startPractice.isPending}
            onClick={handleRetryWeak}
            sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
          >
            {startPractice.isPending ? 'Iniciando…' : `Repasar ${cardsToRetryCount} tarjetas débiles`}
          </Button>
        )}
        
        <Button
          variant={cardsToRetryCount > 0 ? "outlined" : "contained"}
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
