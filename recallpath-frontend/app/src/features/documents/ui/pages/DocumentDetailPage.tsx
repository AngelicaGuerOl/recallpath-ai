import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Alert, Box, Button, CircularProgress, Divider, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../../../shared/ui/layout/PageContainer'
import type { DocumentStatus } from '../domain/entities/Document'
import { useDocument, useDocumentPages } from '../hooks/useDocuments'

const STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: 'Subido',
  EXTRACTING: 'Procesando',
  READY: 'Listo',
  FAILED: 'Con error',
  ARCHIVED: 'Archivado',
}

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const id = Number(documentId)
  
  const docQuery = useDocument(id)
  const doc = docQuery.data

  const [fromPage, setFromPage] = useState<number>(1)
  const [toPage, setToPage] = useState<number>(1)
  const [viewPageIndex, setViewPageIndex] = useState<number>(0)

  const pagesQuery = useDocumentPages(id, fromPage, toPage)
  const pages = pagesQuery.data?.pages ?? []

  if (docQuery.isLoading) {
    return (
      <PageContainer>
        <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress />
          <Typography>Cargando documento...</Typography>
        </Stack>
      </PageContainer>
    )
  }

  if (docQuery.isError || !doc) {
    return (
      <PageContainer>
        <Alert severity="error">No fue posible cargar el documento.</Alert>
        <Button component={Link} to="/documents" sx={{ mt: 2 }}>Volver a documentos</Button>
      </PageContainer>
    )
  }

  const isReady = doc.status === 'READY'
  const isArchived = doc.status === 'ARCHIVED'
  const isFailed = doc.status === 'FAILED'
  const pageCount = doc.pageCount ?? 1

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = parseInt(e.target.value, 10)
    if (isNaN(val)) val = 1
    if (val < 1) val = 1
    if (val > pageCount) val = pageCount
    setFromPage(val)
    if (val > toPage) setToPage(val)
    setViewPageIndex(0)
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = parseInt(e.target.value, 10)
    if (isNaN(val)) val = pageCount
    if (val > pageCount) val = pageCount
    if (val < fromPage) val = fromPage
    setToPage(val)
    setViewPageIndex(0)
  }

  const selectedCount = toPage - fromPage + 1
  const totalCharacters = pages.reduce((sum, p) => sum + p.characterCount, 0)
  const hasMismatch = pages.some(p => p.characterCount !== p.extractedText.length)

  const currentPage = pages[viewPageIndex]

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Box>
          <Button component={Link} to="/documents" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
            Volver a documentos
          </Button>
          <Typography variant="h4" component="h1" sx={{ wordBreak: 'break-word' }}>
            {doc.originalFileName}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {doc.pageCount ? `${doc.pageCount} páginas` : 'Páginas desconocidas'} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {STATUS_LABELS[doc.status]}
          </Typography>
        </Box>

        {isFailed && (
          <Alert severity="error">
            El procesamiento falló: {doc.errorMessage}
          </Alert>
        )}

        {isArchived && (
          <Alert severity="warning">
            Este documento está archivado.
          </Alert>
        )}

        {isReady && !isArchived && (
          <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Selección de páginas</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecciona el intervalo de páginas de donde quieres extraer texto.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField 
                  label="Desde la página" 
                  type="number" 
                  value={fromPage} 
                  onChange={handleFromChange} 
                  slotProps={{ htmlInput: { min: 1, max: pageCount } }}
                  size="small"
                />
                <Typography>hasta</Typography>
                <TextField 
                  label="Hasta la página" 
                  type="number" 
                  value={toPage} 
                  onChange={handleToChange} 
                  slotProps={{ htmlInput: { min: fromPage, max: pageCount } }}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'medium' }}>
                {selectedCount} {selectedCount === 1 ? 'página seleccionada' : 'páginas seleccionadas'} 
                {pages.length > 0 ? ` (${totalCharacters.toLocaleString()} caracteres en total)` : ''}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Vista previa</Typography>
                
                {pages.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Tooltip title="Página anterior">
                      <span>
                        <IconButton 
                          aria-label="Página anterior"
                          onClick={() => setViewPageIndex(i => i - 1)} 
                          disabled={viewPageIndex === 0 || pagesQuery.isLoading}
                        >
                          <ChevronLeftIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center' }}>
                      Página {currentPage?.pageNumber ?? '-'}
                    </Typography>
                    <Tooltip title="Página siguiente">
                      <span>
                        <IconButton 
                          aria-label="Página siguiente"
                          onClick={() => setViewPageIndex(i => i + 1)} 
                          disabled={viewPageIndex >= pages.length - 1 || pagesQuery.isLoading}
                        >
                          <ChevronRightIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>

              {pagesQuery.isLoading ? (
                <Stack sx={{ alignItems: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Stack>
              ) : pagesQuery.isError ? (
                <Alert severity="error">Error al cargar las páginas.</Alert>
              ) : currentPage ? (
                <Stack spacing={2}>
                  {hasMismatch && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Advertencia: La cantidad de caracteres reportada no coincide con el texto recibido.
                    </Alert>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    La distribución del texto puede variar respecto al PDF original.
                  </Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      bgcolor: 'grey.50', 
                      border: 1, 
                      borderColor: 'grey.200',
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                        userSelect: 'text'
                      }}
                    >
                      {currentPage.extractedText}
                    </Typography>
                  </Paper>
                </Stack>
              ) : null}
            </Box>

            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button variant="contained" disabled fullWidth>
                Generar tarjetas
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                La generación automática se implementará en la siguiente etapa.
              </Typography>
            </Box>
          </Paper>
        )}
      </Stack>
    </PageContainer>
  )
}
