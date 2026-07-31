import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined'
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { Flashcard } from '../../domain/entities/Flashcard'

type FlashcardGridProps = {
  cards: Flashcard[]
  readonly?: boolean
  onEdit(card: Flashcard): void
  onArchive(card: Flashcard): void
  onRestore(card: Flashcard): void
}

/**
 * Etiquetas visibles que coinciden con las del formulario.
 * Los valores internos (EASY / MEDIUM / HARD) no se modifican.
 */
const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Básica',
  MEDIUM: 'Intermedia',
  HARD: 'Avanzada',
}

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
}

const CARD_BORDER_RADIUS = '20px'

function FlashcardMenuButton({
  card,
  readonly,
  onEdit,
  onArchive,
  onRestore,
}: {
  card: Flashcard
  readonly?: boolean
  onEdit(card: Flashcard): void
  onArchive(card: Flashcard): void
  onRestore(card: Flashcard): void
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  function handleOpen(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget)
  }
  function handleClose() {
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Opciones de ${card.term}`}
        aria-controls={open ? `card-menu-${card.id}` : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleOpen}
        disabled={readonly}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id={`card-menu-${card.id}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            handleClose()
            onEdit(card)
          }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        {card.status === 'ACTIVE' ? (
          <MenuItem
            onClick={() => {
              handleClose()
              onArchive(card)
            }}
          >
            <ArchiveOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Archivar
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleClose()
              onRestore(card)
            }}
          >
            <UnarchiveOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Restaurar
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

export function FlashcardGridSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0,1fr))',
          lg: 'repeat(3, minmax(0,1fr))',
        },
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={180}
          sx={{ borderRadius: CARD_BORDER_RADIUS }}
          aria-label="Cargando tarjeta"
        />
      ))}
    </Box>
  )
}

export function FlashcardGrid({ cards, readonly, onEdit, onArchive, onRestore }: FlashcardGridProps) {
  return (
    <Box
      component="section"
      aria-label="Tarjetas del conjunto"
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0,1fr))',
          lg: 'repeat(3, minmax(0,1fr))',
        },
      }}
    >
      {cards.map((card) => (
        <Paper
          key={card.id}
          elevation={0}
          tabIndex={0}
          sx={{
            p: 2.5,
            borderRadius: CARD_BORDER_RADIUS,
            border: '1.5px solid',
            borderColor: card.status === 'ARCHIVED' ? 'divider' : 'grey.300',
            bgcolor: card.status === 'ARCHIVED' ? 'grey.50' : 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            opacity: card.status === 'ARCHIVED' ? 0.7 : 1,
            outline: 'none',
            transition: 'border-color 0.18s, box-shadow 0.18s',
            '&:hover, &:focus-visible': {
              borderColor: card.status === 'ACTIVE' ? 'primary.main' : 'divider',
              boxShadow: card.status === 'ACTIVE' ? '0 0 0 1px var(--mui-palette-primary-main)' : 'none',
            },
          }}
        >
          {/* Header: término + menú */}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography
              variant="subtitle1"
              sx={{ wordBreak: 'break-word', flex: 1, mr: 1, fontWeight: 600 }}
            >
              {card.term}
            </Typography>
            <FlashcardMenuButton
              card={card}
              readonly={readonly}
              onEdit={onEdit}
              onArchive={onArchive}
              onRestore={onRestore}
            />
          </Stack>

          {/* Definición — máx 3 líneas */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {card.definition}
          </Typography>

          {/* Chips: dificultad, categoría, archivada */}
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={DIFFICULTY_LABELS[card.difficulty] ?? card.difficulty}
              size="small"
              color={DIFFICULTY_COLORS[card.difficulty] ?? 'default'}
              variant="outlined"
            />
            {card.category ? (
              <Chip label={card.category} size="small" variant="outlined" />
            ) : null}
            {card.status === 'ARCHIVED' ? (
              <Chip label="Archivada" size="small" />
            ) : null}
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
