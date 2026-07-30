import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import type { Deck } from '../../domain/entities/Deck'

type DeckListProps = {
  decks: Deck[]
  onEdit(deck: Deck): void
  onArchive(deck: Deck): void
}

export function DeckList({ decks, onEdit, onArchive }: DeckListProps) {
  return (
    <Stack spacing={1.5} aria-label="Listado de conjuntos">
      {decks.map((deck) => (
        <Paper key={deck.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{deck.name}</Typography>
                {deck.archivedAt ? <Chip size="small" label="Archivado" /> : null}
              </Stack>
              <Typography color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {deck.description ?? 'Sin descripción'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Actualizado: {formatDate(deck.updatedAt)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
              {!deck.archivedAt ? (
                <Tooltip title="Editar">
                  <IconButton aria-label={`Editar ${deck.name}`} onClick={() => onEdit(deck)}>
                    <EditOutlinedIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
              {!deck.archivedAt ? (
                <Tooltip title="Archivar">
                  <IconButton aria-label={`Archivar ${deck.name}`} color="warning" onClick={() => onArchive(deck)}>
                    <ArchiveOutlinedIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
