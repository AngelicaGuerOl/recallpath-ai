import AddIcon from '@mui/icons-material/Add'
import DescriptionIcon from '@mui/icons-material/Description'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SearchIcon from '@mui/icons-material/Search'
import { Alert, Box, Button, CircularProgress, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { getErrorMessage } from '../../../../shared/api/apiError'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { PageContainer } from '../../../../shared/ui/layout/PageContainer'
import type { Document, DocumentQuery, DocumentStatus } from '../../domain/entities/Document'
import { DocumentFormDialog } from '../components/DocumentFormDialog'
import { DocumentList } from '../components/DocumentList'
import { useArchiveDocument, useRestoreDocument } from '../hooks/useDocumentMutations'
import { useDocuments } from '../hooks/useDocuments'

const filterOptions: { label: string, value: DocumentStatus | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Procesados', value: 'READY' },
  { label: 'Con error', value: 'FAILED' },
  { label: 'Archivados', value: 'ARCHIVED' },
]

export function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [docToArchive, setDocToArchive] = useState<Document | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  
  const query: DocumentQuery = useMemo(() => ({
    search,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  }), [search, statusFilter])

  const documentsQuery = useDocuments(query)
  const archiveDoc = useArchiveDocument()
  const restoreDoc = useRestoreDocument()

  async function handleArchive() {
    if (!docToArchive) return
    try {
      setMutationError(null)
      await archiveDoc.mutateAsync(docToArchive.id)
      setDocToArchive(null)
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  async function handleRestore(doc: Document) {
    try {
      setMutationError(null)
      await restoreDoc.mutateAsync(doc.id)
    } catch (error) {
      setMutationError(getErrorMessage(error))
    }
  }

  const documents = documentsQuery.data ?? []
  const isEmptyState = !documentsQuery.isLoading && documents.length === 0 && !search && statusFilter === 'ALL'
  const isFilteredEmpty = !documentsQuery.isLoading && documents.length === 0 && (search || statusFilter !== 'ALL')

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <DescriptionIcon color="primary" sx={{ fontSize: 34 }} />
            <Box>
              <Typography variant="h4" component="h1">Mis documentos</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Sube tus materiales y selecciona las páginas que quieres convertir en tarjetas.
              </Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Subir PDF
          </Button>
        </Stack>

        <Stack spacing={2}>
          <TextField
            label="Buscar documentos"
            placeholder="Buscar por nombre de archivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            value={statusFilter}
            onChange={(_, value) => setStatusFilter(value)}
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

        {documentsQuery.isLoading && (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography>Cargando documentos...</Typography>
          </Stack>
        )}

        {documentsQuery.isError && (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 4 }}>
            <Alert severity="error" sx={{ width: '100%' }}>No fue posible cargar los documentos.</Alert>
            <Button variant="outlined" onClick={() => documentsQuery.refetch()}>Reintentar</Button>
          </Stack>
        )}

        {mutationError && (
          <Alert severity="error" onClose={() => setMutationError(null)}>{mutationError}</Alert>
        )}

        {isEmptyState && (
          <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, px: 3 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1 }}>Sube tu primer documento</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Podrás extraer el texto y generar tarjetas automáticamente.</Typography>
            <Button variant="contained" size="large" onClick={() => setDialogOpen(true)} startIcon={<AddIcon />}>
              Subir PDF
            </Button>
          </Box>
        )}

        {isFilteredEmpty && (
          <Stack spacing={2} sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5" component="h2">No hay resultados</Typography>
            <Typography color="text.secondary">Intenta buscar con otros términos o filtros.</Typography>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={() => { setSearch(''); setStatusFilter('ALL'); }}>
              Restablecer filtros
            </Button>
          </Stack>
        )}

        {documents.length > 0 && (
          <DocumentList documents={documents} onArchive={setDocToArchive} onRestore={handleRestore} />
        )}
      </Stack>

      <DocumentFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <ConfirmDialog
        open={Boolean(docToArchive)}
        title="Archivar documento"
        description="¿Seguro que quieres archivar este documento? Ya no podrás usarlo para generar tarjetas."
        confirmLabel="Archivar"
        loading={archiveDoc.isPending}
        onClose={() => setDocToArchive(null)}
        onConfirm={handleArchive}
      />
    </PageContainer>
  )
}
