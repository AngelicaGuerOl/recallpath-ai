import { Alert, Box, Button, CircularProgress, Container, Snackbar } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../../../shared/api/apiError'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { useDeck } from '../../../decks/ui/hooks/useDeck'
import { PracticeCard } from '../components/PracticeCard'
import { PracticeControls } from '../components/PracticeControls'
import { PracticeHeader } from '../components/PracticeHeader'
import { PracticeSummary } from '../components/PracticeSummary'
import { MultipleChoiceCard } from '../components/MultipleChoiceCard'
import { MultipleChoiceSummary } from '../components/MultipleChoiceSummary'
import { useCancelPracticeSession, useSubmitPracticeResult } from '../hooks/usePracticeMutations'
import { usePracticeSession } from '../hooks/usePractice'
import type { PracticeResult } from '../../domain/entities/Practice'

export function PracticePage() {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>()
  const sessionId = Number(sessionIdParam)
  const navigate = useNavigate()

  const { data: session, isLoading, isError, refetch } = usePracticeSession(sessionId)
  const deckQuery = useDeck(session?.deckId ?? NaN)
  const submitResult = useSubmitPracticeResult(sessionId)
  const cancelSession = useCancelPracticeSession(sessionId)

  const [isFlipped, setIsFlipped] = useState(false)
  const startTimeRef = useRef<number>(0)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [prevCardId, setPrevCardId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (session?.currentCard && session.currentCard.id !== prevCardId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevCardId(session.currentCard.id)
      setIsFlipped(false)
      startTimeRef.current = Date.now()
    }
  }, [session?.currentCard, prevCardId])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !session) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          No se pudo cargar la sesión de práctica.
        </Alert>
      </Box>
    )
  }

  const isMultipleChoice = session.mode === 'MULTIPLE_CHOICE'

  // Sesión completada: resumen según el modo
  if (session.status === 'COMPLETED') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {isMultipleChoice ? (
          <MultipleChoiceSummary sessionId={sessionId} deckId={session.deckId} />
        ) : (
          <PracticeSummary sessionId={sessionId} deckId={session.deckId} />
        )}
      </Container>
    )
  }

  // Sesión cancelada
  if (session.status === 'CANCELLED') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Esta sesión fue cancelada.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(`/decks/${session.deckId}`)}>
          Volver
        </Button>
      </Container>
    )
  }

  const currentCard = session.currentCard

  async function handleResult(result: PracticeResult, userAnswer?: string) {
    if (!currentCard) return
    const responseTimeMs = Date.now() - startTimeRef.current

    try {
      setErrorMessage(null)
      await submitResult.mutateAsync({
        cardId: currentCard.id,
        input: { result, responseTimeMs, userAnswer },
      })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleCancelConfirm() {
    try {
      await cancelSession.mutateAsync()
      if (session?.deckId) {
        navigate(`/decks/${session.deckId}`)
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setShowCancelDialog(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
      <PracticeHeader
        deckName={deckQuery.data?.name ?? 'Cargando...'}
        currentPosition={session.completedCards + (currentCard ? 1 : 0)}
        totalCards={session.totalCards}
        completedCards={session.completedCards}
        onCancel={() => setShowCancelDialog(true)}
        mode={session.mode}
      />

      <Container
        maxWidth="md"
        sx={{ py: { xs: 4, md: 6 }, flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {currentCard ? (
          isMultipleChoice ? (
            /* ── Modo Opción Múltiple ── */
            <MultipleChoiceCard
              card={currentCard}
              onResult={(result, userAnswer) => handleResult(result, userAnswer)}
              disabled={submitResult.isPending}
            />
          ) : (
            /* ── Modo Flashcard tradicional ── */
            <>
              <PracticeCard
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(true)}
              />
              <PracticeControls
                visible={isFlipped}
                disabled={submitResult.isPending}
                onResult={handleResult}
              />
            </>
          )
        ) : (
          <Alert severity="info">No hay tarjetas pendientes.</Alert>
        )}
      </Container>

      <ConfirmDialog
        open={showCancelDialog}
        title="¿Quieres cancelar la sesión?"
        description="Los resultados ya guardados se conservarán."
        cancelLabel="Seguir practicando"
        confirmLabel="Cancelar y salir"
        loading={cancelSession.isPending}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelConfirm}
      />

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
