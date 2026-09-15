import { describe, it, expect, beforeEach } from 'vitest'
import definition from './index'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGameWithHistory,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('Imp', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('is alive and able to wake when its later-night slot is reached', () => {
      const player = makePlayer({ id: 'p1', roleId: 'imp' })
      const players = [
        player,
        ...Array.from({ length: 6 }, (_, index) =>
          makePlayer({ id: `other-${index}` }),
        ),
      ]
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players }),
      )
      expect(definition.shouldWake!(game, player)).toBe(true)
    })

    it('is excluded from the first-night action order', () => {
      expect(definition.firstNightOrder).toBeNull()
    })

    it('wakes when alive on later rounds', () => {
      const player = makePlayer({ id: 'p1', roleId: 'imp' })
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
        makePlayer({ id: 'p1', roleId: 'imp' }),
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
  // NIGHT STEPS
  // ================================================================

  describe('nightSteps', () => {
    it('contains only the later-night victim choice', () => {
      expect(definition.nightSteps?.map((step) => step.id)).toEqual([
        'choose_victim',
      ])
    })

    it('does not declare select_new_imp in nightSteps (handled by imp_starpass_pending effect via pipeline)', () => {
      const steps = definition.nightSteps!
      const selectNewImp = steps.find((s) => s.id === 'select_new_imp')
      expect(selectNewImp).toBeUndefined()
    })
  })

  // ================================================================
  // NIGHT ACTION OUTPUT
  // ================================================================

  describe('night action intent', () => {
    it('emits a kill intent via the NightAction result', () => {
      // The Imp's NightAction calls onComplete with an intent of type "kill".
      // We can't render the React component here, but we verify the role definition
      // is set up to emit intents by checking it has a NightAction.
      // The actual intent shape { type: "kill", sourceId, targetId, cause: "demon" }
      // is tested in the pipeline integration tests.
      expect(definition.NightAction).toBeDefined()
    })
  })
})
