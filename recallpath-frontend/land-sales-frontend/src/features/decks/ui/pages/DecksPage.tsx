import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Button, CircularProgress, FormControl, InputAdornment, InputLabel, MenuItem, Pagination, Paper, Select, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { getErrorMessage } from '../../../../shared/api/apiError'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { PageContainer } from '../../../../shared/ui/layout/PageContainer'
import type { Deck, DeckFormInput, DeckQuery } from '../../domain/entities/Deck'
import { DeckFormDialog } from '../components/DeckFormDialog'
import { DeckList } from '../components/DeckList'
import { useArchiveDeck, useCreateDeck, useUpdateDeck } from '../hooks/useDeckMutations'
import { useDecks } from '../hooks/useDecks'

const PAGE_SIZE = 10

export function DecksPage() {
  const [search, setSearch] = useState('')
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived'>('active')
  const [page, setPage] = useState(0)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [deckToArchive, setDeckToArchive] = useState<Deck | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const query: DeckQuery = useMemo(() => ({
    page,
    size: PAGE_SIZE,
    search,
    archived: archivedFilter === 'archived',
  }), [archivedFilter, page, search])

  const decksQuery = useDecks(query)
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()
  const archiveDeck = useArchiveDeck()
  const mutationLoading = createDeck.isPending || updateDeck.isPending || archiveDeck.isPending

  function openCreateDialog() {
    setSelectedDeck(null)
    setDialogMode('create')
    setMutationError(null)
  }

  function openEditDialog(deck: Deck) {
    setSelectedDeck(deck)
    setDialogMode('edit')
    setMutationError(null)
  }

  function closeFormDialog() {
    setDialogMode(null)
    setSelectedDeck(null)
  }

  async function submitDeck(input: DeckFormInput) {
    try {
      setMutationError(null)
      if (dialogMode === 'edit' && selectedDeck) {
        await updateDeck.mutateAsync({ id: selectedDeck.id, input })
        setSuccessMessage('Conjunto actualizado correctamente.')
      } else {
        await createDeck.mutateAsync(input)
        setSuccessMessage('Conjunto creado correctamente.')
      }
      closeFormDialog()
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  async function confirmArchive() {
    if (!deckToArchive) return
    try {
      setMutationError(null)
      await archiveDeck.mutateAsync(deckToArchive.id)
      setSuccessMessage('Conjunto archivado correctamente.')
      setDeckToArchive(null)
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  const decks = decksQuery.data?.content ?? []
  const totalPages = decksQuery.data?.totalPages ?? 0

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="h1">Conjuntos de estudio</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Organiza los temas que estudiarás más adelante.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Crear conjunto
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Buscar por nombre"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl sx={{ minWidth: { xs: '100%', md: 220 } }}>
              <InputLabel id="archived-filter-label">Estado</InputLabel>
              <Select
                labelId="archived-filter-label"
                label="Estado"
                value={archivedFilter}
                onChange={(event) => {
                  setArchivedFilter(event.target.value as 'active' | 'archived')
                  setPage(0)
                }}
              >
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="archived">Archivados</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {decksQuery.isLoading ? (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
            <CircularProgress aria-label="Cargando conjuntos" />
            <Typography>Cargando conjuntos...</Typography>
          </Stack>
        ) : null}

        {decksQuery.isError ? (
          <Alert severity="error">No fue posible cargar los conjuntos.</Alert>
        ) : null}

        {mutationError ? <Alert severity="error">{mutationError}</Alert> : null}

        {!decksQuery.isLoading && !decksQuery.isError && decks.length === 0 ? (
          <EmptyState title="Sin conjuntos" description="Crea un conjunto o ajusta los filtros de búsqueda." />
        ) : null}

        {decks.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {decksQuery.data?.totalElements ?? 0} resultado(s)
            </Typography>
            <DeckList decks={decks} onEdit={openEditDialog} onArchive={setDeckToArchive} />
            {totalPages > 1 ? (
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                sx={{ alignSelf: 'center' }}
              />
            ) : null}
          </>
        ) : null}
      </Stack>

      <DeckFormDialog
        open={dialogMode !== null}
        deck={selectedDeck}
        loading={mutationLoading}
        onClose={closeFormDialog}
        onSubmit={submitDeck}
      />
      <ConfirmDialog
        open={deckToArchive !== null}
        title="Archivar conjunto"
        description={deckToArchive ? `¿Quieres archivar "${deckToArchive.name}"? Podrás conservarlo para historial, pero no editarlo.` : ''}
        confirmLabel="Archivar"
        loading={archiveDeck.isPending}
        onClose={() => setDeckToArchive(null)}
        onConfirm={confirmArchive}
      />
      <Snackbar open={successMessage !== null} autoHideDuration={4000} onClose={() => setSuccessMessage(null)}>
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>
    </PageContainer>
  )
}
