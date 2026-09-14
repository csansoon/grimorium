import { describe, expect, it } from 'vitest'
import { MAX_BASE_PLAYERS, MIN_BASE_PLAYERS, SCRIPTS } from '../scripts'

describe('official base-game setup limits', () => {
  it('supports the official 5–15 player range without Travellers', () => {
    expect(MIN_BASE_PLAYERS).toBe(5)
    expect(MAX_BASE_PLAYERS).toBe(15)
  })

  it('contains exactly the 22 official Trouble Brewing characters', () => {
    const roles = SCRIPTS['trouble-brewing'].roles

    expect(roles).toHaveLength(22)
    expect(roles).not.toContain('villager')
    expect(new Set(roles).size).toBe(roles.length)
  })
})
