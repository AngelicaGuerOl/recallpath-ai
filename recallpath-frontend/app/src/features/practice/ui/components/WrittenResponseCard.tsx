import { Box, Button, Card, CardContent, CircularProgress, Typography, TextField, Paper } from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useState } from 'react'
import type { PracticeSessionCard } from '../../domain/entities/Practice'

type WrittenResponseCardProps = {
  card: PracticeSessionCard
  lastEvaluation?: { correct: boolean; feedback: string } | null
  onResult: (userAnswer: string) => void
  onNext: () => void
  disabled?: boolean
}

export function WrittenResponseCard({ card, lastEvaluation, onResult, onNext, disabled }: WrittenResponseCardProps) {
  const [answer, setAnswer] = useState('')

  const [prevCardId, setPrevCardId] = useState(card.id)

  if (card.id !== prevCardId) {
    setPrevCardId(card.id)
    setAnswer('')
  }

  const handleEvaluate = () => {
    if (answer.trim()) {
      onResult(answer.trim())
    }
  }

  const isEvaluated = lastEvaluation != null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.2 }}>
        RESPONDE CON TUS PALABRAS
      </Typography>

      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          minHeight: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 3,
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ width: '100%' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
            {card.termSnapshot}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!isEvaluated && (
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Escribe tu respuesta aquí..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            sx={{ bgcolor: 'background.paper' }}
          />
        )}

        {!isEvaluated ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled={!answer.trim() || disabled}
            onClick={handleEvaluate}
            startIcon={disabled ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{ py: 1.5, mt: 1 }}
          >
            Evaluar respuesta con IA
          </Button>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: lastEvaluation.correct ? 'success.50' : 'error.50',
                border: 1,
                borderColor: lastEvaluation.correct ? 'success.200' : 'error.200',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                {lastEvaluation.correct ? (
                  <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 28 }} />
                ) : (
                  <CancelOutlinedIcon color="error" sx={{ fontSize: 28 }} />
                )}
                <Typography variant="h6" color={lastEvaluation.correct ? 'success.main' : 'error.main'}>
                  {lastEvaluation.correct ? '¡Correcto!' : 'Todavía no'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  TU RESPUESTA:
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
                  "{answer}"
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                FEEDBACK DE LA IA:
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                {lastEvaluation.feedback}
              </Typography>

              {!lastEvaluation.correct && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'error.200' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    DEFINICIÓN DE REFERENCIA:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.definitionSnapshot}
                  </Typography>
                </Box>
              )}
            </Paper>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={onNext}
              sx={{ py: 1.5 }}
            >
              Siguiente pregunta
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
