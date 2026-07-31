import { useQuery } from '@tanstack/react-query'
import { getPracticeSession, getPracticeSummary } from '../../api/practiceApi'
import { practiceQueryKeys } from './practiceQueryKeys'

export function usePracticeSession(sessionId: number) {
  return useQuery({
    queryKey: practiceQueryKeys.session(sessionId),
    queryFn: () => getPracticeSession(sessionId),
    enabled: !isNaN(sessionId),
  })
}

export function usePracticeSummary(sessionId: number, enabled: boolean) {
  return useQuery({
    queryKey: practiceQueryKeys.summary(sessionId),
    queryFn: () => getPracticeSummary(sessionId),
    enabled: enabled && !isNaN(sessionId),
  })
}
