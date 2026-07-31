import { Box } from '@mui/material'
import type { Document } from '../../domain/entities/Document'
import { DocumentCard } from './DocumentCard'

type DocumentListProps = {
  documents: Document[]
  onArchive: (doc: Document) => void
  onRestore: (doc: Document) => void
}

export function DocumentList({ documents, onArchive, onRestore }: DocumentListProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onArchive={onArchive} onRestore={onRestore} />
      ))}
    </Box>
  )
}
