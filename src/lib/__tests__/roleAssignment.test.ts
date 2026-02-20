import { describe, it, expect } from 'vitest'
import { resolveRoleAssignments } from '../roleAssignment'

// ============================================================================
// HELPERS
// ============================================================================

const players5 = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']
const noManual: Record<string, string | null> = {
  Alice: null,
  Bob: null,
  Carol: null,
  Dave: null,
  Eve: null,
}

function getRoleIds(result: { name: string; roleId: string }[]): string[] {
  return result.map((a) => a.roleId).sort()
}

function getPlayerNames(result: { name: string; roleId: string }[]): string[] {
  return result.map((a) => a.name).sort()
}

// ============================================================================
// BASIC ASSIGNMENT
// ============================================================================

describe('resolveRoleAssignments', () => {
  describe('basic assignment', () => {
    it('assigns all players when roles match player count exactly', () => {
      const roles = ['villager', 'chef', 'monk', 'saint', 'imp']
      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: noManual,
      })

      expect(result).toHaveLength(5)
      expect(getPlayerNames(result)).toEqual(players5.sort())
      expect(getRoleIds(result)).toEqual(roles.sort())
    })

    it('respects manual assignments', () => {
      const roles = ['villager', 'chef', 'monk', 'saint', 'imp']
      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: {
          Alice: 'imp',
          Bob: null,
          Carol: null,
          Dave: null,
          Eve: null,
        },
      })

      expect(result).toHaveLength(5)
      const aliceAssignment = result.find((a) => a.name === 'Alice')
      expect(aliceAssignment?.roleId).toBe('imp')
    })

    it('assigns all manual assignments correctly', () => {
      const roles = ['villager', 'chef', 'monk', 'saint', 'imp']
      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: {
          Alice: 'imp',
          Bob: 'chef',
          Carol: 'monk',
          Dave: 'saint',
          Eve: 'villager',
        },
      })

      expect(result).toHaveLength(5)
      expect(result.find((a) => a.name === 'Alice')?.roleId).toBe('imp')
      expect(result.find((a) => a.name === 'Bob')?.roleId).toBe('chef')
      expect(result.find((a) => a.name === 'Carol')?.roleId).toBe('monk')
      expect(result.find((a) => a.name === 'Dave')?.roleId).toBe('saint')
      expect(result.find((a) => a.name === 'Eve')?.roleId).toBe('villager')
    })

    it('handles more roles than players by selecting a subset', () => {
      const roles = [
        'villager',
        'chef',
        'monk',
        'saint',
        'imp',
        'empath',
        'soldier',
        'washerwoman',
      ]
      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: noManual,
      })

      expect(result).toHaveLength(5)
      expect(getPlayerNames(result)).toEqual(players5.sort())
      // Every assigned role should come from the pool
      for (const a of result) {
        expect(roles).toContain(a.roleId)
      }
    })

    it('preserves original player order in the result', () => {
      const roles = ['villager', 'chef', 'monk', 'saint', 'imp']
      for (let i = 0; i < 50; i++) {
        const result = resolveRoleAssignments({
          players: players5,
          selectedRoles: roles,
          manualAssignments: noManual,
        })
        const names = result.map((a) => a.name)
        expect(names).toEqual(players5)
      }
    })

    it('each player gets exactly one role', () => {
      const roles = ['villager', 'chef', 'monk', 'saint', 'imp']
      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: noManual,
      })

      const names = result.map((a) => a.name)
      expect(new Set(names).size).toBe(names.length)
    })
  })

  // ============================================================================
  // DEMON GUARANTEE
  // ============================================================================

  describe('demon role guarantee', () => {
    it('always includes a demon when more roles than players (no manual)', () => {
      const roles = [
        'villager',
        'chef',
        'monk',
        'saint',
        'empath',
        'soldier',
        'washerwoman',
        'imp',
      ]

      // Run many times to ensure it's not just luck
      for (let i = 0; i < 100; i++) {
        const result = resolveRoleAssignments({
          players: players5,
          selectedRoles: roles,
          manualAssignments: noManual,
        })

        const hasDemon = result.some((a) => a.roleId === 'imp')
        expect(hasDemon).toBe(true)
      }
    })

    it('does not double-assign demon when already manually assigned', () => {
      const roles = [
        'villager',
        'chef',
        'monk',
        'saint',
        'imp',
        'empath',
        'soldier',
      ]

      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: {
          Alice: 'imp',
          Bob: null,
          Carol: null,
          Dave: null,
          Eve: null,
        },
      })

      expect(result).toHaveLength(5)
      const impAssignments = result.filter((a) => a.roleId === 'imp')
      expect(impAssignments).toHaveLength(1)
      expect(impAssignments[0].name).toBe('Alice')
    })

    it('handles pool with no demon roles gracefully', () => {
      const roles = ['villager', 'chef', 'monk', 'saint', 'empath']

      const result = resolveRoleAssignments({
        players: players5,
        selectedRoles: roles,
        manualAssignments: noManual,
      })

      expect(result).toHaveLength(5)
      // No demon in pool — nothing to guarantee, but it shouldn't crash
      const hasDemon = result.some((a) => a.roleId === 'imp')
      expect(hasDemon).toBe(false)
    })

    it('guarantees demon even when pool greatly exceeds player count', () => {
      const roles = [
        'villager',
        'chef',
        'monk',
        'saint',
        'empath',
        'soldier',
        'washerwoman',
        'librarian',
        'investigator',
        'fortune_teller',
        'undertaker',
        'ravenkeeper',
        'virgin',
        'slayer',
        'mayor',
        'imp',
      ]

      for (let i = 0; i < 100; i++) {
        const result = resolveRoleAssignments({
          players: ['Alice', 'Bob', 'Carol'],
          selectedRoles: roles,
          manualAssignments: {
            Alice: null,
            Bob: null,
            Carol: null,
          },
        })

        expect(result).toHaveLength(3)
        const hasDemon = result.some((a) => a.roleId === 'imp')
        expect(hasDemon).toBe(true)
      }
    })

    it('does not reserve demon when all players are manually assigned', () => {
      const roles = ['villager', 'chef', 'imp']
      const result = resolveRoleAssignments({
        players: ['Alice', 'Bob', 'Carol'],
        selectedRoles: roles,
        manualAssignments: {
          Alice: 'villager',
          Bob: 'chef',
          Carol: 'villager',
        },
      })

      // Manual assignments are respected even without demon
      expect(result).toHaveLength(3)
      expect(result.find((a) => a.name === 'Alice')?.roleId).toBe('villager')
      expect(result.find((a) => a.name === 'Bob')?.roleId).toBe('chef')
      expect(result.find((a) => a.name === 'Carol')?.roleId).toBe('villager')
    })
  })

  // ============================================================================
  // MANUAL + RANDOM MIX
  // ============================================================================

  describe('manual and random mix', () => {
    it('manual assignments reduce the random pool correctly', () => {
      const roles = ['villager', 'chef', 'imp']
      const result = resolveRoleAssignments({
        players: ['Alice', 'Bob', 'Carol'],
        selectedRoles: roles,
        manualAssignments: {
          Alice: 'chef',
          Bob: null,
          Carol: null,
        },
      })

      expect(result).toHaveLength(3)
      expect(result.find((a) => a.name === 'Alice')?.roleId).toBe('chef')

      // Bob and Carol should get the remaining roles (villager and imp)
      const bobRole = result.find((a) => a.name === 'Bob')?.roleId
      const carolRole = result.find((a) => a.name === 'Carol')?.roleId
      expect([bobRole, carolRole].sort()).toEqual(['imp', 'villager'])
    })

    it('correctly handles duplicate roles in the pool', () => {
      const roles = ['villager', 'villager', 'imp']
      const result = resolveRoleAssignments({
        players: ['Alice', 'Bob', 'Carol'],
        selectedRoles: roles,
        manualAssignments: {
          Alice: 'villager',
          Bob: null,
          Carol: null,
        },
      })

      expect(result).toHaveLength(3)
      expect(result.find((a) => a.name === 'Alice')?.roleId).toBe('villager')

      // Remaining: one villager and one imp
      const bobRole = result.find((a) => a.name === 'Bob')?.roleId
      const carolRole = result.find((a) => a.name === 'Carol')?.roleId
      expect([bobRole, carolRole].sort()).toEqual(['imp', 'villager'])
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('works with a single player', () => {
      const result = resolveRoleAssignments({
        players: ['Alice'],
        selectedRoles: ['imp', 'villager'],
        manualAssignments: { Alice: null },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Alice')
      // Demon guarantee: imp should be assigned
      expect(result[0].roleId).toBe('imp')
    })

    it('works with exactly matching roles and players (no excess)', () => {
      const roles = ['villager', 'imp']
      const result = resolveRoleAssignments({
        players: ['Alice', 'Bob'],
        selectedRoles: roles,
        manualAssignments: { Alice: null, Bob: null },
      })

      expect(result).toHaveLength(2)
      expect(getRoleIds(result)).toEqual(['imp', 'villager'])
    })
  })
})
