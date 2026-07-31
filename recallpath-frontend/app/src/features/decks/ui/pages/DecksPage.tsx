import AddIcon from '@mui/icons-material/Add'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Button, CircularProgress, InputAdornment, Pagination, Snackbar, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { getErrorMessage } from '../../../../shared/api/apiError'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { PageContainer } from '../../../../shared/ui/layout/PageContainer'
import type { Deck, DeckFormInput, DeckQuery } from '../../domain/entities/Deck'
import { DeckFormDialog } from '../components/DeckFormDialog'
import { DeckList } from '../components/DeckList'
import { useArchiveDeck, useCreateDeck, useUpdateDeck, useUnarchiveDeck } from '../hooks/useDeckMutations'
import { useDecks } from '../hooks/useDecks'

const PAGE_SIZE = 10

const filterOptions = [
  { label: 'Todos', value: 'all' as const },
  { label: 'Activos', value: 'active' as const },
  { label: 'Archivados', value: 'archived' as const },
]

export function DecksPage() {
  const [search, setSearch] = useState('')
  const [archivedFilter, setArchivedFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [page, setPage] = useState(0)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [deckToArchive, setDeckToArchive] = useState<Deck | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const query: DeckQuery = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search,
      archived:
        archivedFilter === 'archived' ? true : archivedFilter === 'active' ? false : undefined,
    }),
    [archivedFilter, page, search],
  )

  const decksQuery = useDecks(query)
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()
  const archiveDeck = useArchiveDeck()
  const unarchiveDeck = useUnarchiveDeck()
  const mutationLoading = createDeck.isPending || updateDeck.isPending || archiveDeck.isPending || unarchiveDeck.isPending
  const [snackbarOpen, setSnackbarOpen] = useState(false)

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
      setSnackbarOpen(true)
      closeFormDialog()
    } catch (error) {
      console.warn('DECK MUTATION ERROR', error)
      setMutationError(getErrorMessage(error))
    }
  }

  async function confirmArchive() {
    if (!deckToArchive) return
    try {
      setMutationError(null)
      await archiveDeck.mutateAsync(deckToArchive.id)
      setSuccessMessage('Conjunto archivado correctamente.')
      setSnackbarOpen(true)
      setDeckToArchive(null)
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  async function handleUnarchive(deck: Deck) {
    try {
      setMutationError(null)
      await unarchiveDeck.mutateAsync(deck.id)
      setSuccessMessage('Conjunto desarchivado correctamente.')
      setSnackbarOpen(true)
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  function handleCloseSnackbar(_event?: unknown, reason?: string) {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const decks = decksQuery.data?.content ?? []
  const totalPages = decksQuery.data?.totalPages ?? 0
  const hasFilters = search.trim().length > 0 || archivedFilter !== 'all'
  const isEmptyState = !decksQuery.isLoading && !decksQuery.isError && decks.length === 0
  const isFilteredEmpty = isEmptyState && hasFilters
  const isNoDecks = isEmptyState && !hasFilters

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AutoStoriesOutlinedIcon color="primary" sx={{ fontSize: 34 }} />
            <Box>
              <Typography variant="h4" component="h1">
                Mis conjuntos
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Organiza tus materiales y conviértelos en actividades de estudio.
              </Typography>
            </Box>
          </Stack>

          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Nuevo conjunto
          </Button>
        </Stack>

        <Stack spacing={2} sx={{ width: '100%' }}>
          <TextField
            label="Buscar conjuntos"
            placeholder="Buscar conjuntos por nombre o tema"
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
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Tabs
            value={archivedFilter}
            onChange={(_, value) => {
              setArchivedFilter(value)
              setPage(0)
            }}
            aria-label="Filtrar conjuntos"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {filterOptions.map((option) => (
              <Tab key={option.value} label={option.label} value={option.value} />
            ))}
          </Tabs>
        </Stack>

        {decksQuery.isLoading ? (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
            <CircularProgress aria-label="Cargando conjuntos" />
            <Typography>Cargando conjuntos...</Typography>
          </Stack>
        ) : null}

        {decksQuery.isError ? (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 4 }}>
            <Alert severity="error" sx={{ width: '100%' }}>
              No fue posible cargar los conjuntos.
            </Alert>
            <Button variant="outlined" onClick={() => decksQuery.refetch()}>
              Reintentar
            </Button>
          </Stack>
        ) : null}

        {mutationError ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {mutationError}
          </Alert>
        ) : null}

        {isNoDecks ? (
          <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, px: 3 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
              Crea tu primer conjunto
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Organiza un tema, agrega tarjetas manualmente o genera tarjetas desde un PDF.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ width: 72, height: 72, bgcolor: 'primary.light', borderRadius: 3, display: 'grid', placeItems: 'center' }}>
                <AutoStoriesOutlinedIcon fontSize="large" htmlColor="#3f51b5" />
              </Box>
              <Box sx={{ width: 72, height: 72, bgcolor: 'secondary.light', borderRadius: 3, display: 'grid', placeItems: 'center' }}>
                <SearchIcon fontSize="large" htmlColor="#5B5BD6" />
              </Box>
              <Box sx={{ width: 72, height: 72, bgcolor: 'grey.100', borderRadius: 3, display: 'grid', placeItems: 'center' }}>
                <AddIcon fontSize="large" color="action" />
              </Box>
            </Stack>
            <Button variant="contained" size="large" onClick={openCreateDialog} startIcon={<AddIcon />}>
              Crear conjunto
            </Button>
          </Box>
        ) : null}

        {isFilteredEmpty ? (
          <Stack spacing={2} sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5" component="h2">
              No hay resultados
            </Typography>
            <Typography color="text.secondary">
              Ajusta tu búsqueda o cambia el filtro para encontrar conjuntos existentes.
            </Typography>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={() => {
              setSearch('')
              setArchivedFilter('all')
            }}>
              Restablecer filtros
            </Button>
          </Stack>
        ) : null}

        {decks.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {decksQuery.data?.totalElements ?? 0} conjunto(s)
            </Typography>
            <DeckList decks={decks} onEdit={openEditDialog} onArchive={setDeckToArchive} onUnarchive={handleUnarchive} />
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
