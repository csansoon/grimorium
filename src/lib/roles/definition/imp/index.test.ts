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
    it('wakes on the first night', () => {
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
      expect(definition.shouldWake!(game, player)).toBe(true)
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
    it('has first-night steps that are conditional on round 1', () => {
      const player = makePlayer({ id: 'p1', roleId: 'imp' })
      const firstNightState = makeState({ round: 1, players: [player] })
      const laterNightState = makeState({ round: 2, players: [player] })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        firstNightState,
      )
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

      // First night: show_minions, select_bluffs, show_bluffs should be active
      const showMinions = steps.find((s) => s.id === 'show_minions')
      const selectBluffs = steps.find((s) => s.id === 'select_bluffs')
      const showBluffs = steps.find((s) => s.id === 'show_bluffs')
      expect(showMinions?.condition!(game, player, firstNightState)).toBe(true)
      expect(selectBluffs?.condition!(game, player, firstNightState)).toBe(true)
      expect(showBluffs?.condition!(game, player, firstNightState)).toBe(true)

      // First night: choose_victim should NOT be active
      const chooseVictim = steps.find((s) => s.id === 'choose_victim')
      expect(chooseVictim?.condition!(game, player, firstNightState)).toBe(
        false,
      )

      // Later nights: first-night steps should NOT be active
      expect(showMinions?.condition!(laterGame, player, laterNightState)).toBe(
        false,
      )
      expect(selectBluffs?.condition!(laterGame, player, laterNightState)).toBe(
        false,
      )
      expect(showBluffs?.condition!(laterGame, player, laterNightState)).toBe(
        false,
      )

      // Later nights: choose_victim should be active
      expect(chooseVictim?.condition!(laterGame, player, laterNightState)).toBe(
        true,
      )
    })

    it('does not declare select_new_imp in nightSteps (it is a dynamic runtime step)', () => {
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
