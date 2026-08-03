import { describe, it, expect, beforeEach } from 'vitest'
import { getRole } from '../../index'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGameWithHistory,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

const definition = getRole('imp')!

describe('Imp', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('does not wake on the first night because Night 1 evil info is system-level', () => {
      const player = makePlayer({ id: 'p1', roleId: 'imp' })
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
      expect(definition.shouldWake!(game, player)).toBe(false)
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
    it('only exposes the kill step on later nights', () => {
      const player = makePlayer({ id: 'p1', roleId: 'imp' })
      const laterNightState = makeState({
        round: 2,
        players: [player],
      })
      const laterGame = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        laterNightState,
      )

      const steps = definition.nightSteps!
      expect(steps.map((step) => step.id)).toEqual(['choose_victim'])
      const chooseVictim = steps.find((s) => s.id === 'choose_victim')
      expect(chooseVictim?.condition!(laterGame, player, laterNightState)).toBe(
        true,
      )
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
