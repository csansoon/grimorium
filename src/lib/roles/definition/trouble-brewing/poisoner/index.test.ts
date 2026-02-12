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

describe('Poisoner', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes on the first night (to see evil team info)', () => {
      const player = makePlayer({ id: 'p1', roleId: 'poisoner' })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBe(true)
    })

    it('wakes on subsequent nights when alive', () => {
      const player = makePlayer({ id: 'p1', roleId: 'poisoner' })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBe(true)
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'poisoner' }),
        'dead',
      )
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBe(false)
    })
  })

  // ================================================================
  // ROLE METADATA
  // ================================================================

  describe('role definition', () => {
    it('is a minion', () => {
      expect(definition.team).toBe('minion')
    })

    it('has a NightAction component', () => {
      expect(definition.NightAction).toBeDefined()
    })

    it('has nightOrder 5 (wakes before most roles)', () => {
      expect(definition.nightOrder).toBe(5)
    })
  })
})
