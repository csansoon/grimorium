import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import { KillIntent } from '../../../pipeline/types'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGame,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('ImpStarpassPending effect', () => {
  const handler = definition.handlers![0]

  // Helper to create a state with an Imp and alive minions
  function makeScenario(overrides?: {
    minionCount?: number
    minionsAlive?: boolean
    poisonerSourcedEffects?: boolean
  }) {
    const {
      minionCount = 1,
      minionsAlive = true,
      poisonerSourcedEffects = false,
    } = overrides ?? {}

    let imp = makePlayer({ id: 'imp', roleId: 'imp' })
    imp = addEffectTo(imp, 'imp_starpass_pending', undefined, 'end_of_night')

    const minions: ReturnType<typeof makePlayer>[] = []
    for (let i = 0; i < minionCount; i++) {
      let minion = makePlayer({
        id: `minion${i}`,
        roleId: i === 0 ? 'poisoner' : 'scarlet_woman',
      })
      if (!minionsAlive) {
        minion = addEffectTo(minion, 'dead')
      }
      minions.push(minion)
    }

    // Optionally add an effect sourced by the first minion
    let villager = makePlayer({ id: 'villager', roleId: 'villager' })
    if (poisonerSourcedEffects) {
      villager = addEffectTo(villager, 'poisoned', undefined, 'end_of_day')
      // Manually set sourcePlayerId for the last effect
      const lastEffect = villager.effects[villager.effects.length - 1]
      villager = {
        ...villager,
        effects: villager.effects.map((e) =>
          e === lastEffect ? { ...e, sourcePlayerId: 'minion0' } : e,
        ),
      }
    }

    const others = [
      villager,
      makePlayer({ id: 'townsfolk1', roleId: 'chef' }),
      makePlayer({ id: 'townsfolk2', roleId: 'washerwoman' }),
    ]

    const state = makeState({
      phase: 'night',
      round: 2,
      players: [imp, ...minions, ...others],
    })
    const game = makeGame(state)

    return { imp, minions, state, game }
  }

  // ================================================================
  // HANDLER — APPLIES TO
  // ================================================================

  describe('appliesTo', () => {
    it('applies when the intent is a self-kill with imp_self_kill cause', () => {
      const { imp, state } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      expect(handler.appliesTo(intent, imp, state)).toBe(true)
    })

    it('does not apply for normal demon kills', () => {
      const { imp, state } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'villager',
        cause: 'demon',
      }

      expect(handler.appliesTo(intent, imp, state)).toBe(false)
    })

    it('does not apply when cause is not imp_self_kill', () => {
      const { imp, state } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'demon',
      }

      expect(handler.appliesTo(intent, imp, state)).toBe(false)
    })

    it('does not apply to a different player (not the effect holder)', () => {
      const { minions, state } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      // The handler is checked against the minion, not the imp
      expect(handler.appliesTo(intent, minions[0], state)).toBe(false)
    })
  })

  // ================================================================
  // HANDLER — HANDLE
  // ================================================================

  describe('handle', () => {
    it('returns request_ui when there are alive minions', () => {
      const { imp, state, game } = makeScenario({ minionCount: 2 })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      expect(result.action).toBe('request_ui')
    })

    it('returns allow (no UI) when there are no alive minions', () => {
      const { imp, state, game } = makeScenario({ minionsAlive: false })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      expect(result.action).toBe('allow')
    })

    it('has a UIComponent when returning request_ui', () => {
      const { imp, state, game } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      if (result.action === 'request_ui') {
        expect(result.UIComponent).toBeDefined()
        expect(result.resume).toBeDefined()
      }
    })
  })

  // ================================================================
  // HANDLER — RESUME (after UI selection)
  // ================================================================

  describe('resume', () => {
    it('returns allow with role change for the selected minion', () => {
      const { imp, state, game } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      if (result.action !== 'request_ui') {
        throw new Error('Expected request_ui')
      }

      const resumed = result.resume('minion0')
      expect(resumed.action).toBe('allow')
      if (resumed.action === 'allow') {
        expect(resumed.stateChanges?.changeRoles).toEqual({
          minion0: 'imp',
        })
      }
    })

    it('adds pending_role_reveal to the new Imp', () => {
      const { imp, state, game } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      if (result.action !== 'request_ui') {
        throw new Error('Expected request_ui')
      }

      const resumed = result.resume('minion0')
      if (resumed.action === 'allow') {
        expect(resumed.stateChanges?.addEffects?.['minion0']).toEqual([
          { type: 'pending_role_reveal', expiresAt: 'never' },
        ])
      }
    })

    it('removes the imp_starpass_pending effect from the old Imp', () => {
      const { imp, state, game } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      if (result.action !== 'request_ui') {
        throw new Error('Expected request_ui')
      }

      const resumed = result.resume('minion0')
      if (resumed.action === 'allow') {
        expect(resumed.stateChanges?.removeEffects?.['imp']).toContain(
          'imp_starpass_pending',
        )
      }
    })

    it('creates a role_changed history entry', () => {
      const { imp, state, game } = makeScenario()
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      if (result.action !== 'request_ui') {
        throw new Error('Expected request_ui')
      }

      const resumed = result.resume('minion0')
      if (resumed.action === 'allow') {
        expect(resumed.stateChanges?.entries).toHaveLength(1)
        expect(resumed.stateChanges!.entries[0].type).toBe('role_changed')
        expect(resumed.stateChanges!.entries[0].data).toEqual({
          playerId: 'minion0',
          fromRole: 'poisoner',
          toRole: 'imp',
        })
      }
    })

    it('cleans up effects sourced by the converting minion', () => {
      const { imp, state, game } = makeScenario({
        poisonerSourcedEffects: true,
      })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'imp',
        targetId: 'imp',
        cause: 'imp_self_kill',
      }

      const result = handler.handle(intent, imp, state, game)
      if (result.action !== 'request_ui') {
        throw new Error('Expected request_ui')
      }

      const resumed = result.resume('minion0')
      if (resumed.action === 'allow') {
        // The poisoned effect on the villager should be removed
        expect(resumed.stateChanges?.removeEffects?.['villager']).toContain(
          'poisoned',
        )
      }
    })
  })
})
