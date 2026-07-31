import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined'
import { Box, Button, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import type { Deck } from '../../domain/entities/Deck'

type DeckListProps = {
  decks: Deck[]
  onEdit(deck: Deck): void
  onArchive(deck: Deck): void
  onUnarchive(deck: Deck): void
}

const accentColors = ['#5B5BD6', '#8D7CF1', '#7B5FEB', '#6354D0', '#A59BF5']

export function DeckList({ decks, onEdit, onArchive, onUnarchive }: DeckListProps) {
  return (
    <Box
      component="section"
      aria-label="Listado de conjuntos"
      sx={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {decks.map((deck) => {
        const accent = getAccentColor(deck.name)

        return (
          <Paper
            key={deck.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 220,
            }}
          >
            <Stack spacing={2} sx={{ minHeight: 0 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: accent,
                    color: 'common.white',
                    fontWeight: 700,
                  }}
                >
                  {deck.name.charAt(0).toUpperCase()}
                </Box>
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                    {deck.name}
                  </Typography>
                  {deck.archivedAt ? (
                    <Chip label="Archivado" size="small" />
                  ) : null}
                </Stack>
              </Stack>
              {deck.description ? (
                <Typography color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  {deck.description}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <AutoStoriesOutlinedIcon color="action" sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">
                  Última actividad: {formatDate(deck.updatedAt)}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              {!deck.archivedAt ? (
                <Button size="small" variant="contained" onClick={() => onEdit(deck)}>
                  Continuar
                </Button>
              ) : (
                <Button size="small" variant="outlined" disabled>
                  Archivado
                </Button>
              )}
              <Stack direction="row" spacing={0.5}>
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
                ) : (
                  <Tooltip title="Desarchivar">
                    <IconButton aria-label={`Desarchivar ${deck.name}`} color="primary" onClick={() => onUnarchive(deck)}>
                      <UnarchiveOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Paper>
        )
      })}
    </Box>
  )
}

function getAccentColor(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return accentColors[hash % accentColors.length]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
