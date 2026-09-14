import { describe, expect, it } from 'vitest'
import { isOfficialRoleSelectionValid } from './RoleSelection'

const distribution = { townsfolk: 3, outsider: 0, minion: 1, demon: 1 }

describe('official role selection validation', () => {
  it('accepts an exact, unique, correctly distributed setup', () => {
    expect(
      isOfficialRoleSelectionValid(
        { chef: 1, empath: 1, monk: 1, poisoner: 1, imp: 1 },
        distribution,
        distribution,
        5,
      ),
    ).toBe(true)
  })

  it('rejects oversized role pools', () => {
    expect(
      isOfficialRoleSelectionValid(
        { chef: 1, empath: 1, monk: 1, slayer: 1, poisoner: 1, imp: 1 },
        { ...distribution, townsfolk: 4 },
        distribution,
        5,
      ),
    ).toBe(false)
  })

  it('rejects duplicate characters and wrong team counts', () => {
    expect(
      isOfficialRoleSelectionValid(
        { chef: 2, empath: 1, poisoner: 1, imp: 1 },
        distribution,
        distribution,
        5,
      ),
    ).toBe(false)
    expect(
      isOfficialRoleSelectionValid(
        { chef: 1, empath: 1, saint: 1, poisoner: 1, imp: 1 },
        { townsfolk: 2, outsider: 1, minion: 1, demon: 1 },
        distribution,
        5,
      ),
    ).toBe(false)
  })
})
