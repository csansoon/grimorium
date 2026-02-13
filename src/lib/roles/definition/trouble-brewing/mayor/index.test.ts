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

describe('Mayor', () => {
  // ================================================================
  // WIN CONDITION — Peaceful Victory
  // ================================================================

  describe('peaceful victory win condition', () => {
    const winCheck = definition.winConditions![0]

    it('good wins when exactly 3 alive, no execution today, and Mayor alive', () => {
      const players = [
        makePlayer({ id: 'p1', roleId: 'mayor' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'imp' }),
      ]
      const state = makeState({ phase: 'day', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'day', round: 2 },
          },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBe('townsfolk')
    })

    it('does not trigger when more than 3 alive', () => {
      const players = [
        makePlayer({ id: 'p1', roleId: 'mayor' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'villager' }),
        makePlayer({ id: 'p4', roleId: 'imp' }),
      ]
      const state = makeState({ phase: 'day', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'day', round: 2 },
          },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBeNull()
    })

    it('does not trigger when an execution happened today', () => {
      const players = [
        makePlayer({ id: 'p1', roleId: 'mayor' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'imp' }),
      ]
      const state = makeState({ phase: 'day', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'day', round: 2 },
          },
          { type: 'execution', data: { playerId: 'p5' } },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBeNull()
    })

    it('does not trigger when Mayor is dead', () => {
      const players = [
        addEffectTo(makePlayer({ id: 'p1', roleId: 'mayor' }), 'dead'),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'imp' }),
        makePlayer({ id: 'p4', roleId: 'villager' }),
      ]
      // Only 3 alive: p2, p3, p4 (Mayor is dead)
      const state = makeState({ phase: 'day', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'day', round: 2 },
          },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBeNull()
    })

    it('does not trigger during night phase', () => {
      const players = [
        makePlayer({ id: 'p1', roleId: 'mayor' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'imp' }),
      ]
      const state = makeState({ phase: 'night', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'night', round: 2 },
          },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBeNull()
    })

    it('does not trigger when the only alive "mayor" is a malfunctioning Drunk', () => {
      const players = [
        // Real Mayor is dead
        addEffectTo(makePlayer({ id: 'p1', roleId: 'mayor' }), 'dead'),
        // Drunk-as-Mayor: roleId changed to 'mayor' during setup, has drunk effect
        addEffectTo(makePlayer({ id: 'p2', roleId: 'mayor' }), 'drunk'),
        makePlayer({ id: 'p3', roleId: 'villager' }),
        makePlayer({ id: 'p4', roleId: 'imp' }),
      ]
      // 3 alive: p2 (Drunk-as-Mayor), p3, p4
      const state = makeState({ phase: 'day', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'day', round: 2 },
          },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBeNull()
    })

    it('does not trigger when virgin_execution happened today', () => {
      const players = [
        makePlayer({ id: 'p1', roleId: 'mayor' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'imp' }),
      ]
      const state = makeState({ phase: 'day', round: 2, players })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { phase: 'day', round: 2 },
          },
          { type: 'virgin_execution', data: { nominatorId: 'p5' } },
        ],
        state,
      )

      expect(winCheck.check(state, game)).toBeNull()
    })
  })

  // ================================================================
  // DEFLECT (handled by Deflect effect — see Deflect.test.ts)
  // ================================================================

  describe('deflect ability', () => {
    it('declares deflect as an initial effect', () => {
      expect(definition.initialEffects).toBeDefined()
      expect(
        definition.initialEffects!.some((e) => e.type === 'deflect'),
      ).toBe(true)
    })
  })
})
