import { describe, expect, it } from 'vitest'
import { deckSchema } from './deckSchema'

describe('deckSchema', () => {
  it('requires a non-blank name', () => {
    const result = deckSchema.safeParse({ name: '   ', description: null })

    expect(result.success).toBe(false)
  })

  it('validates maximum lengths', () => {
    expect(deckSchema.safeParse({ name: 'a'.repeat(121), description: null }).success).toBe(false)
    expect(deckSchema.safeParse({ name: 'Valid', description: 'a'.repeat(501) }).success).toBe(false)
  })

  it('normalizes submitted values', () => {
    const result = deckSchema.parse({ name: '  Spring Boot  ', description: '   ' })

    expect(result).toEqual({ name: 'Spring Boot', description: null })
  })
})
