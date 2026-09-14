import { describe, it, expect, beforeEach } from 'vitest'
import definition, { createPoisonResult } from '.'
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
    it('wakes on the first night to poison after evil starting info', () => {
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

    it('acts first among character abilities on every night', () => {
      expect(definition.firstNightOrder).toBe(10)
      expect(definition.otherNightOrder).toBe(10)
    })
  })

  describe('poison resolution', () => {
    it('applies poison when the Poisoner is healthy', () => {
      const poisoner = makePlayer({ id: 'p1', roleId: 'poisoner' })
      const target = makePlayer({ id: 'p2', roleId: 'chef' })

      const result = createPoisonResult(poisoner, target)

      expect(result.addEffects?.p2?.[0]).toMatchObject({
        type: 'poisoned',
        sourcePlayerId: 'p1',
        expiresAt: 'end_of_day',
      })
    })

    it.each(['poisoned', 'drunk'] as const)(
      'does not apply poison when the Poisoner is %s',
      (malfunctionEffect) => {
        const poisoner = addEffectTo(
          makePlayer({ id: 'p1', roleId: 'poisoner' }),
          malfunctionEffect,
        )
        const target = makePlayer({ id: 'p2', roleId: 'chef' })

        const result = createPoisonResult(poisoner, target)

        expect(result.addEffects).toBeUndefined()
        expect(result.entries[0].data).toMatchObject({
          action: 'poison',
          targetId: 'p2',
          malfunctioned: true,
        })
      },
    )
  })
})
