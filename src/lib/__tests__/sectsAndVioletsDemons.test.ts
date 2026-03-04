import { beforeEach, describe, expect, it } from 'vitest'
import { applyPipelineChanges, resolveIntent } from '../pipeline'
import { checkEndOfDayWinConditions } from '../game'
import { syncDerivedEffects } from '../stateSync'
import { getCurrentState, hasEffect } from '../types'
import {
  addEffectTo,
  makeGame,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from './helpers'
import { KillIntent } from '../pipeline/types'

beforeEach(() => resetPlayerCounter())

describe('Sects & Violets demon slice', () => {
  it('Fang Gu jumps to an Outsider and dies instead', () => {
    const fangGu = addEffectTo(
      makePlayer({ id: 'fang', roleId: 'fang_gu' }),
      'fang_gu_jump',
    )
    const outsider = makePlayer({ id: 'outsider', roleId: 'sweetheart' })
    const state = makeState({
      phase: 'night',
      round: 2,
      players: [fangGu, outsider, makePlayer({ id: 'town', roleId: 'chef' })],
    })
    const game = makeGame(state)
    const intent: KillIntent = {
      type: 'kill',
      sourceId: 'fang',
      targetId: 'outsider',
      cause: 'demon',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const updatedState = getCurrentState(updated)
    const updatedFangGu = updatedState.players.find((player) => player.id === 'fang')!
    const updatedOutsider = updatedState.players.find(
      (player) => player.id === 'outsider',
    )!

    expect(hasEffect(updatedFangGu, 'dead')).toBe(true)
    expect(updatedOutsider.roleId).toBe('fang_gu')
    expect(hasEffect(updatedOutsider, 'pending_role_reveal')).toBe(true)
    expect(hasEffect(updatedOutsider, 'fang_gu_jump')).toBe(true)
  })

  it('No Dashii poisons the closest Townsfolk neighbors on both sides', () => {
    const state = makeState({
      phase: 'night',
      round: 2,
      players: [
        makePlayer({ id: 'washer', roleId: 'washerwoman' }),
        makePlayer({ id: 'witch', roleId: 'witch' }),
        makePlayer({ id: 'dashii', roleId: 'no_dashii' }),
        makePlayer({ id: 'saint', roleId: 'saint' }),
        makePlayer({ id: 'chef', roleId: 'chef' }),
      ],
    })

    const synced = syncDerivedEffects(state)
    const washer = synced.players.find((player) => player.id === 'washer')!
    const chef = synced.players.find((player) => player.id === 'chef')!
    const witch = synced.players.find((player) => player.id === 'witch')!

    expect(
      washer.effects.some(
        (effect) => effect.type === 'poisoned' && effect.data?.source === 'no_dashii',
      ),
    ).toBe(true)
    expect(
      chef.effects.some(
        (effect) => effect.type === 'poisoned' && effect.data?.source === 'no_dashii',
      ),
    ).toBe(true)
    expect(
      witch.effects.some(
        (effect) => effect.type === 'poisoned' && effect.data?.source === 'no_dashii',
      ),
    ).toBe(false)
  })

  it('Vigormortis marks killed minions and poisons their closest alive Townsfolk neighbor', () => {
    const vigor = addEffectTo(
      makePlayer({ id: 'vigor', roleId: 'vigormortis' }),
      'vigormortis_demon',
    )
    const state = makeState({
      phase: 'night',
      round: 2,
      players: [
        makePlayer({ id: 'chef', roleId: 'chef' }),
        makePlayer({ id: 'witch', roleId: 'witch' }),
        makePlayer({ id: 'saint', roleId: 'saint' }),
        vigor,
      ],
    })
    const game = makeGame(state)
    const intent: KillIntent = {
      type: 'kill',
      sourceId: 'vigor',
      targetId: 'witch',
      cause: 'demon',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const updatedState = getCurrentState(updated)
    const witch = updatedState.players.find((player) => player.id === 'witch')!
    const chef = updatedState.players.find((player) => player.id === 'chef')!

    expect(hasEffect(witch, 'dead')).toBe(true)
    expect(hasEffect(witch, 'vigormortis_killed')).toBe(true)
    expect(
      chef.effects.some(
        (effect) =>
          effect.type === 'poisoned' && effect.data?.source === 'vigormortis',
      ),
    ).toBe(true)
  })

  it('Vortox wins at end of day if nobody was executed', () => {
    const vortox = addEffectTo(
      makePlayer({ id: 'vortox', roleId: 'vortox' }),
      'vortox_rule',
    )
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [vortox, makePlayer({ id: 'town', roleId: 'chef' }), makePlayer({ id: 'other', roleId: 'washerwoman' })],
    })
    const game = makeGameWithHistory([{ type: 'day_started', data: { round: 2 } }], state)

    expect(checkEndOfDayWinConditions(state, game)).toBe('demon')
  })
})
