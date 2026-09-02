import { describe, expect, it } from 'vitest'
import { getNextStep, checkWinCondition, skipNightAction } from '../game'
import { buildTransformationStateChanges } from '../transformations'
import { assertEngineInvariants } from '../testing/invariants'
import {
  getPlayerByRole,
  runScenario,
} from '../testing/scenarioRunner'
import { hasEffect } from '../types'

describe('character-universe certification scenarios', () => {
  it('respects immediate queue precedence after transformation', () => {
    const ctx = runScenario({
      name: 'Immediate Queue Precedence',
      roles: ['snake_charmer', 'imp', 'washerwoman', 'poisoner', 'villager'],
      steps: [
        { type: 'start_night' },
        {
          type: 'apply_night_action',
          result: (runner) => {
            const state = runner.getState()
            const snakeCharmer = getPlayerByRole(state, 'snake_charmer')
            const poisoner = getPlayerByRole(state, 'poisoner')
            if (!snakeCharmer || !poisoner) {
              throw new Error('Missing players for transformation scenario')
            }

            return buildTransformationStateChanges(state, {
              kind: 'role_change',
              source: {
                cause: 'test_transformation',
                playerId: snakeCharmer.id,
                roleId: 'snake_charmer',
              },
              targets: [
                {
                  playerId: snakeCharmer.id,
                  newRoleId: 'poisoner',
                  queuePolicy: 'act_immediately_force',
                  reveal: 'pending',
                },
              ],
            })
          },
        },
      ],
    })

    let next = getNextStep(ctx.game)
    for (let i = 0; i < 10; i++) {
      if (
        (next.type === 'night_action' || next.type === 'night_action_skip') &&
        next.systemStepId
      ) {
        ctx.game = skipNightAction(
          ctx.game,
          next.roleId,
          next.playerId,
          next.systemStepId,
        )
        next = getNextStep(ctx.game)
        continue
      }
      break
    }
    expect(next.type === 'night_action' || next.type === 'night_action_skip').toBe(
      true,
    )
    if (next.type === 'night_action' || next.type === 'night_action_skip') {
      const state = ctx.getState()
      const transformed = state.players.find(
        (player) =>
          player.baseRoleId === 'snake_charmer' && player.roleId === 'poisoner',
      )
      expect(next.playerId).toBe(transformed?.id)
      expect(next.roleId).toBe('poisoner')
    }
    assertEngineInvariants(ctx.game, { checkQueuePrecedence: false })
  })

  it('keeps witch-cursed nominations valid while killing the nominator', () => {
    const ctx = runScenario({
      name: 'Witch Curse Nomination',
      roles: ['witch', 'villager', 'imp', 'washerwoman', 'chef'],
      steps: [
        { type: 'start_night' },
        { type: 'start_day' },
        {
          type: 'apply_night_action',
          result: (runner) => {
            const state = runner.getState()
            const cursed = state.players.find((player) => player.roleId === 'villager')
            if (!cursed) throw new Error('Missing cursed player')
            return {
              entries: [
                {
                  type: 'night_action',
                  message: [{ type: 'text', content: 'Apply witch curse for test' }],
                  data: {
                    roleId: 'witch',
                    playerId: cursed.id,
                    action: 'test_apply_witch_curse',
                  },
                },
              ],
              addEffects: {
                [cursed.id]: [{ type: 'witch_curse' }],
              },
            }
          },
        },
        {
          type: 'resolve_intent',
          intent: (runner) => {
            const state = runner.getState()
            const nominator = state.players.find(
              (player) => player.roleId === 'villager',
            )
            const nominee = state.players.find((player) => player.roleId === 'imp')
            if (!nominator || !nominee) {
              throw new Error('Missing nomination players')
            }
            return {
              type: 'nominate',
              nominatorId: nominator.id,
              nomineeId: nominee.id,
            }
          },
        },
      ],
    })

    const state = ctx.getState()
    const nominator = state.players.find((player) => player.roleId === 'villager')
    expect(nominator).toBeDefined()
    expect(nominator?.effects.some((effect) => effect.type === 'dead')).toBe(true)
    expect(
      ctx.game.history.some((entry) => entry.type === 'nomination'),
    ).toBe(true)
    assertEngineInvariants(ctx.game)
  })

  it('prevents premature town win when scarlet woman succeeds demon takeover', () => {
    const ctx = runScenario({
      name: 'Scarlet Woman Successor',
      roles: ['imp', 'scarlet_woman', 'washerwoman', 'chef', 'monk'],
      steps: [
        {
          type: 'resolve_intent',
          intent: (runner) => {
            const state = runner.getState()
            const imp = getPlayerByRole(state, 'imp')
            if (!imp) throw new Error('Missing imp')
            return {
              type: 'execute',
              playerId: imp.id,
              cause: 'execution',
            }
          },
        },
      ],
    })

    const state = ctx.getState()
    expect(checkWinCondition(state, ctx.game)).not.toBe('townsfolk')
    const aliveImpExists = state.players.some(
      (player) => player.roleId === 'imp' && !hasEffect(player, 'dead'),
    )
    expect(aliveImpExists).toBe(true)
    assertEngineInvariants(ctx.game)
  })
})
