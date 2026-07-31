import { Navigate, Route, Routes } from 'react-router-dom'
import { DecksPage } from '../../features/decks'
import { DeckDetailPage } from '../../features/flashcards'
import { PracticePage } from '../../features/practice/ui/pages/PracticePage'
import { DocumentsPage } from '../../features/documents/ui/pages/DocumentsPage'
import { DocumentDetailPage } from '../../features/documents/ui/pages/DocumentDetailPage'
import { MainLayout } from '../../shared/ui/layout/MainLayout'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/decks" replace />} />
      <Route path="/decks" element={<MainLayout><DecksPage /></MainLayout>} />
      <Route path="/decks/:deckId" element={<MainLayout><DeckDetailPage /></MainLayout>} />
      <Route path="/documents" element={<MainLayout><DocumentsPage /></MainLayout>} />
      <Route path="/documents/:documentId" element={<MainLayout><DocumentDetailPage /></MainLayout>} />
      <Route path="/practice/:sessionId" element={<PracticePage />} />
      <Route path="*" element={<Navigate to="/decks" replace />} />
    </Routes>
  )
}
