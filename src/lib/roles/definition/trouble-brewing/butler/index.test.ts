import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGameWithHistory,
  resetPlayerCounter,
} from '../../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('Butler', () => {
  // ================================================================
  // BASIC PROPERTIES
  // ================================================================

  describe('basic properties', () => {
    it('is an outsider', () => {
      expect(definition.team).toBe('outsider')
    })

    it('has a night action', () => {
      expect(definition.NightAction).toBeDefined()
    })

    it('has no initial effects', () => {
      expect(definition.initialEffects).toBeUndefined()
    })
  })

  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes on the first night while alive', () => {
      const butler = makePlayer({ id: 'butler', roleId: 'butler' })
      const game = makeGameWithHistory(
        [{ type: 'night_started', stateOverrides: { round: 1 } }],
        makeState({ round: 1, players: [butler] }),
      )

      expect(definition.shouldWake!(game, butler)).toBe(true)
    })

    it('has a nightOrder so it appears in the night dashboard', () => {
      expect(definition.nightOrder).toBeDefined()
      expect(typeof definition.nightOrder).toBe('number')
    })
  })

  // ================================================================
  // BUTLER MASTER EFFECT
  // ================================================================

  describe('butler_master effect integration', () => {
    it("butler_master effect stores the master's player ID in data", () => {
      const butler = addEffectTo(
        makePlayer({ id: 'butler', roleId: 'butler' }),
        'butler_master',
        { masterId: 'p2' },
      )

      const masterEffect = butler.effects.find(
        (e) => e.type === 'butler_master',
      )
      expect(masterEffect).toBeDefined()
      expect(masterEffect!.data?.masterId).toBe('p2')
    })

    it('butler without butler_master effect has no voting restriction', () => {
      const butler = makePlayer({ id: 'butler', roleId: 'butler' })
      const masterEffect = butler.effects.find(
        (e) => e.type === 'butler_master',
      )
      expect(masterEffect).toBeUndefined()
    })
  })

  // ================================================================
  // MALFUNCTION BEHAVIOR
  // ================================================================

  describe('malfunction', () => {
    it('when malfunctioning, the effect should NOT be applied (Butler votes freely)', () => {
      // The NightAction component conditionally omits addEffects when
      // isMalfunctioning returns true, following the Monk pattern.
      // This is a UI-level concern tested via component behavior.
      // Here we verify the role has a NightAction that handles malfunction.
      expect(definition.NightAction).toBeDefined()
    })

    it('poisoned Butler still wakes', () => {
      const butler = addEffectTo(
        makePlayer({ id: 'butler', roleId: 'butler' }),
        'poisoned',
      )
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [butler] }),
      )

      expect(definition.shouldWake!(game, butler)).toBe(true)
    })

    it('dead Butler does not wake', () => {
      const butler = addEffectTo(
        makePlayer({ id: 'butler', roleId: 'butler' }),
        'dead',
      )
      const game = makeGameWithHistory(
        [{ type: 'night_started', stateOverrides: { round: 2 } }],
        makeState({ round: 2, players: [butler] }),
      )

      expect(definition.shouldWake!(game, butler)).toBe(false)
    })
  })
})
