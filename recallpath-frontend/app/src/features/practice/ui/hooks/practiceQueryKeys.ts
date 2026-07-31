export const practiceQueryKeys = {
  all: ['practice'] as const,
  session: (sessionId: number) => [...practiceQueryKeys.all, 'session', sessionId] as const,
  summary: (sessionId: number) => [...practiceQueryKeys.all, 'summary', sessionId] as const,
}
