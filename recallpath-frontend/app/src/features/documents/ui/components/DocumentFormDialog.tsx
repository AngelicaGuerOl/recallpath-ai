import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { getErrorMessage } from '../../../../shared/api/apiError'
import { useUploadDocument } from '../hooks/useDocumentMutations'

type DocumentFormDialogProps = {
  open: boolean
  onClose: () => void
}

export function DocumentFormDialog({ open, onClose }: DocumentFormDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadDocument()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('El archivo debe ser un documento PDF')
        setFile(null)
      } else {
        setFile(selected)
        setError(null)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    try {
      setError(null)
      await upload.mutateAsync(file)
      handleClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function handleClose() {
    setFile(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={upload.isPending ? undefined : handleClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Subir PDF</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              sx={{ 
                height: 120, 
                borderStyle: 'dashed', 
                borderWidth: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
              disabled={upload.isPending}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const droppedFile = e.dataTransfer.files?.[0]
                if (droppedFile) {
                  if (droppedFile.type !== 'application/pdf') {
                    setError('El archivo debe ser un documento PDF')
                    setFile(null)
                  } else {
                    setFile(droppedFile)
                    setError(null)
                  }
                }
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                Seleccionar archivo PDF
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'none' }}>
                o arrastra y suelta el archivo aquí
              </Typography>
            </Button>
            
            <input
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {file && (
              <Typography variant="body2" color="text.secondary">
                Seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}

            {upload.isPending && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Procesando documento...</Typography>
                <LinearProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error">{error}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={upload.isPending}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!file || upload.isPending}
          >
            Subir
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
