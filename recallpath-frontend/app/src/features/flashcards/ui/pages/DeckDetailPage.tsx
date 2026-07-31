import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../../../shared/api/apiError'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { PageContainer } from '../../../../shared/ui/layout/PageContainer'
import { useDeck } from '../../../decks/ui/hooks/useDeck'
import type { Flashcard, FlashcardFormInput } from '../../domain/entities/Flashcard'
import { FlashcardGrid, FlashcardGridSkeleton } from '../components/FlashcardGrid'
import { FlashcardFormDialog } from '../components/FlashcardFormDialog'
import { useFlashcards } from '../hooks/useFlashcards'
import {
  useArchiveFlashcard,
  useCreateFlashcard,
  useRestoreFlashcard,
  useUpdateFlashcard,
} from '../hooks/useFlashcardMutations'

/**
 * Mínimo de tarjetas activas requerido por modo de práctica.
 * Solo Flashcards está implementado; los demás son referencia futura.
 */
const PRACTICE_MIN = {
  flashcards: 1,
  // escrita: 1,
  // opcionMultiple: 4,
  // relacionar: 4,
  // memoria: 4,
} as const

export function DeckDetailPage() {
  const { deckId: deckIdParam } = useParams<{ deckId: string }>()
  const deckId = Number(deckIdParam)
  const navigate = useNavigate()

  const deckQuery = useDeck(deckId)
  const flashcardsQuery = useFlashcards(deckId)

  const createFlashcard = useCreateFlashcard(deckId)
  const updateFlashcard = useUpdateFlashcard(deckId)
  const archiveFlashcard = useArchiveFlashcard(deckId)
  const restoreFlashcard = useRestoreFlashcard(deckId)

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null)
  const [cardToArchive, setCardToArchive] = useState<Flashcard | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const deck = deckQuery.data
  const cards = flashcardsQuery.data ?? []
  const isArchived = Boolean(deck?.archivedAt)
  const activeCards = cards.filter((c) => c.status === 'ACTIVE')
  const activeCount = activeCards.length
  const hasNoCards = !flashcardsQuery.isLoading && cards.length === 0

  // Practicar: habilitado cuando hay al menos 1 tarjeta activa y el deck no está archivado
  const canPractice = !isArchived && activeCount >= PRACTICE_MIN.flashcards

  const mutationPending =
    createFlashcard.isPending ||
    updateFlashcard.isPending ||
    archiveFlashcard.isPending ||
    restoreFlashcard.isPending

  function openCreateDialog() {
    setSelectedCard(null)
    setDialogMode('create')
    setMutationError(null)
  }

  function openEditDialog(card: Flashcard) {
    setSelectedCard(card)
    setDialogMode('edit')
    setMutationError(null)
  }

  function closeDialog() {
    setDialogMode(null)
    setSelectedCard(null)
    setMutationError(null)
  }

  function handleCloseSnackbar(_event?: unknown, reason?: string) {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  async function submitCard(input: FlashcardFormInput) {
    try {
      setMutationError(null)
      if (dialogMode === 'edit' && selectedCard) {
        await updateFlashcard.mutateAsync({ cardId: selectedCard.id, input })
        setSuccessMessage('Tarjeta actualizada correctamente.')
      } else {
        await createFlashcard.mutateAsync(input)
        setSuccessMessage('Tarjeta creada correctamente.')
      }
      setSnackbarOpen(true)
      closeDialog()
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  async function confirmArchive() {
    if (!cardToArchive) return
    try {
      setMutationError(null)
      await archiveFlashcard.mutateAsync(cardToArchive.id)
      setSuccessMessage('Tarjeta archivada correctamente.')
      setSnackbarOpen(true)
      setCardToArchive(null)
    } catch (error) {
      setMutationError(getErrorMessage(error))
      setCardToArchive(null)
    }
  }

  async function handleRestore(card: Flashcard) {
    try {
      setMutationError(null)
      await restoreFlashcard.mutateAsync(card.id)
      setSuccessMessage('Tarjeta restaurada correctamente.')
      setSnackbarOpen(true)
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  // Pluralización: "0 tarjetas activas" / "1 tarjeta activa" / "2 tarjetas activas"
  const activeCountLabel =
    activeCount === 1
      ? '1 tarjeta activa'
      : `${activeCount} tarjetas activas`

  const deckLoading = deckQuery.isLoading
  const deckError = deckQuery.isError

  return (
    <PageContainer>
      <Stack spacing={3}>
        {/* Back button */}
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/decks')}
          >
            Mis conjuntos
          </Button>
        </Box>

        {/* Deck header */}
        {deckLoading ? (
          <Stack spacing={1}>
            <Box sx={{ height: 36, width: 240, bgcolor: 'grey.200', borderRadius: 1 }} />
            <Box sx={{ height: 20, width: 320, bgcolor: 'grey.100', borderRadius: 1 }} />
          </Stack>
        ) : deckError ? (
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Alert severity="error">No fue posible cargar el conjunto.</Alert>
            <Button variant="outlined" onClick={() => deckQuery.refetch()}>
              Reintentar
            </Button>
          </Stack>
        ) : deck ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h4" component="h1" sx={{ wordBreak: 'break-word' }}>
                  {deck.name}
                </Typography>
                {/* Solo mostrar chip cuando está archivado */}
                {isArchived ? <Chip label="Archivado" size="small" /> : null}
              </Stack>
              {deck.description ? (
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {deck.description}
                </Typography>
              ) : null}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {activeCountLabel}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
              <Tooltip
                title={
                  isArchived
                    ? 'El conjunto está archivado'
                    : !canPractice
                      ? 'Agrega al menos una tarjeta para practicar'
                      : ''
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<SchoolOutlinedIcon />}
                    disabled={!canPractice}
                    aria-label={canPractice ? 'Practicar' : 'Practicar (requiere tarjetas activas)'}
                  >
                    Practicar
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                disabled={isArchived}
                aria-label="Agregar tarjeta"
              >
                Agregar tarjeta
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {/* Mutation error (outside dialog — visible cuando el dialog está cerrado) */}
        {mutationError && dialogMode === null ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {mutationError}
          </Alert>
        ) : null}

        {/* Archived notice */}
        {deck && isArchived ? (
          <Alert severity="info">
            Este conjunto está archivado. Puedes ver las tarjetas, pero no editarlas.
          </Alert>
        ) : null}

        {/* Flashcards */}
        {flashcardsQuery.isLoading ? (
          <FlashcardGridSkeleton />
        ) : flashcardsQuery.isError ? (
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Alert severity="error">No fue posible cargar las tarjetas.</Alert>
            <Button variant="outlined" onClick={() => flashcardsQuery.refetch()}>
              Reintentar
            </Button>
          </Stack>
        ) : hasNoCards ? (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: '20px',
              px: 3,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Crea tu primera tarjeta
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Agrega términos y definiciones manualmente o genéralos más adelante desde un PDF.
            </Typography>
            {!isArchived ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                Agregar tarjeta
              </Button>
            ) : null}
          </Box>
        ) : (
          <FlashcardGrid
            cards={cards}
            readonly={isArchived}
            onEdit={openEditDialog}
            onArchive={setCardToArchive}
            onRestore={handleRestore}
          />
        )}
      </Stack>

      {/* Form dialog */}
      <FlashcardFormDialog
        open={dialogMode !== null}
        card={selectedCard}
        loading={mutationPending}
        serverError={mutationError}
        onClose={closeDialog}
        onSubmit={submitCard}
      />

      {/* Confirm archive */}
      <ConfirmDialog
        open={cardToArchive !== null}
        title="Archivar tarjeta"
        description={
          cardToArchive
            ? `¿Quieres archivar la tarjeta "${cardToArchive.term}"? Seguirá visible en modo lectura.`
            : ''
        }
        confirmLabel="Archivar"
        loading={archiveFlashcard.isPending}
        onClose={() => setCardToArchive(null)}
        onConfirm={confirmArchive}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </PageContainer>
  )
}
