import { Navigate, Route, Routes } from 'react-router-dom'
import { DecksPage } from '../../features/decks'
import { DeckDetailPage } from '../../features/flashcards'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/decks" replace />} />
      <Route path="/decks" element={<DecksPage />} />
      <Route path="/decks/:deckId" element={<DeckDetailPage />} />
      <Route path="*" element={<Navigate to="/decks" replace />} />
    </Routes>
  )
}
