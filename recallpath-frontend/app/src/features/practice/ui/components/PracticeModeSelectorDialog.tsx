import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'

type PracticeModeSelectorDialogProps = {
  open: boolean
  activeCardsCount: number
  onClose: () => void
  onSelect: (mode: 'FLASHCARDS' | 'MULTIPLE_CHOICE' | 'WRITTEN_RESPONSE') => void
  disabled?: boolean
}

export function PracticeModeSelectorDialog({
  open,
  activeCardsCount,
  onClose,
  onSelect,
  disabled = false,
}: PracticeModeSelectorDialogProps) {
  const canPracticeFlashcards = activeCardsCount >= 1
  const canPracticeMultipleChoice = activeCardsCount >= 4

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Elige un modo de práctica</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box
            component="button"
            disabled={!canPracticeFlashcards || disabled}
            onClick={() => onSelect('FLASHCARDS')}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              textAlign: 'left',
              gap: 2,
              p: 2.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              cursor: canPracticeFlashcards && !disabled ? 'pointer' : 'default',
              opacity: canPracticeFlashcards ? 1 : 0.6,
              transition: 'all 0.2s ease-in-out',
              '&:hover': canPracticeFlashcards && !disabled ? {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              } : {},
            }}
          >
            <SchoolOutlinedIcon color="primary" sx={{ fontSize: 32, mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                Tarjetas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Recuerda la respuesta y califica qué tan fácil fue.
              </Typography>
              {!canPracticeFlashcards && (
                <Typography variant="caption" color="error">
                  Requiere al menos 1 tarjeta elegible (tienes {activeCardsCount}).
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            component="button"
            disabled={!canPracticeMultipleChoice || disabled}
            onClick={() => onSelect('MULTIPLE_CHOICE')}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              textAlign: 'left',
              gap: 2,
              p: 2.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              cursor: canPracticeMultipleChoice && !disabled ? 'pointer' : 'default',
              opacity: canPracticeMultipleChoice ? 1 : 0.6,
              transition: 'all 0.2s ease-in-out',
              '&:hover': canPracticeMultipleChoice && !disabled ? {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              } : {},
            }}
          >
            <QuizOutlinedIcon color="primary" sx={{ fontSize: 32, mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                Opción múltiple
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Selecciona la definición correcta entre cuatro opciones.
              </Typography>
              {!canPracticeMultipleChoice && (
                <Typography variant="caption" color="error">
                  Requiere al menos 4 tarjetas elegibles (tienes {activeCardsCount}).
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            component="button"
            disabled={!canPracticeFlashcards || disabled}
            onClick={() => onSelect('WRITTEN_RESPONSE')}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              textAlign: 'left',
              gap: 2,
              p: 2.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              cursor: canPracticeFlashcards && !disabled ? 'pointer' : 'default',
              opacity: canPracticeFlashcards ? 1 : 0.6,
              transition: 'all 0.2s ease-in-out',
              '&:hover': canPracticeFlashcards && !disabled ? {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              } : {},
            }}
          >
            <EditOutlinedIcon color="primary" sx={{ fontSize: 32, mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                Respuesta escrita
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Escribe la respuesta con tus palabras. Una IA evaluará si la idea es correcta.
              </Typography>
              {!canPracticeFlashcards && (
                <Typography variant="caption" color="error">
                  Requiere al menos 1 tarjeta elegible.
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} size="large">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
