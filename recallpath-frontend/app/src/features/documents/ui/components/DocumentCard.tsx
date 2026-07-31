import DescriptionIcon from '@mui/icons-material/Description'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Card, CardActionArea, CardContent, CardHeader, Chip, IconButton, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Document } from '../../domain/entities/Document'

type DocumentCardProps = {
  document: Document
  onArchive: (doc: Document) => void
  onRestore: (doc: Document) => void
}

export function DocumentCard({ document, onArchive, onRestore }: DocumentCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = (event?: React.MouseEvent) => {
    event?.stopPropagation()
    event?.preventDefault()
    setAnchorEl(null)
  }

  const isArchived = document.status === 'ARCHIVED'
  const isFailed = document.status === 'FAILED'
  const isReady = document.status === 'READY'
  const isProcessing = document.status === 'EXTRACTING' || document.status === 'UPLOADED'

  let color: 'default' | 'primary' | 'success' | 'error' | 'warning' = 'default'
  if (isReady) color = 'success'
  if (isFailed) color = 'error'
  if (isProcessing) color = 'warning'

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardActionArea component={Link} to={`/documents/${document.id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <CardHeader
          avatar={<DescriptionIcon color="primary" />}
          title={
            <Typography variant="subtitle1" component="h3" noWrap sx={{ pr: 3, fontWeight: 'medium' }}>
              {document.originalFileName}
            </Typography>
          }
          subheader={new Date(document.createdAt).toLocaleDateString()}
          sx={{ width: '100%', alignItems: 'flex-start' }}
        />
        <CardContent sx={{ pt: 0, width: '100%' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {document.pageCount ? `${document.pageCount} páginas` : 'Páginas desconocidas'} • {(document.fileSize / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Chip label={document.status} size="small" color={color} />
        </CardContent>
      </CardActionArea>

      <IconButton
        aria-label="opciones del documento"
        aria-controls="document-menu"
        aria-haspopup="true"
        onClick={handleMenuClick}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="document-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        {isArchived ? (
          <MenuItem onClick={() => onRestore(document)}>
            <ListItemText>Desarchivar</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => onArchive(document)}>
            <ListItemText>Archivar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  )
}
