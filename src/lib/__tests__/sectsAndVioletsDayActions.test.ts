import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyPipelineChanges,
  getAvailableDayActions,
  resolveIntent,
} from '../pipeline'
import { NominateIntent } from '../pipeline/types'
import { checkWinCondition } from '../game'
import { getCurrentState, hasEffect } from '../types'
import {
  addEffectTo,
  makeGame,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from './helpers'

const mockT = {}

beforeEach(() => resetPlayerCounter())

describe('Sects & Violets day-phase edge cases', () => {
  it('allows a Witch-cursed nomination to proceed while still killing the nominator', () => {
    const cursed = addEffectTo(
      makePlayer({ id: 'cursed', roleId: 'washerwoman' }),
      'witch_curse',
      { witchId: 'witch' },
      'end_of_day',
    )
    const nominee = makePlayer({ id: 'nominee', roleId: 'chef' })
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [cursed, nominee],
    })
    const game = makeGame(state)
    const intent: NominateIntent = {
      type: 'nominate',
      nominatorId: 'cursed',
      nomineeId: 'nominee',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const updatedState = getCurrentState(updated)
    const updatedCursed = updatedState.players.find((player) => player.id === 'cursed')!
    const updatedNominee = updatedState.players.find((player) => player.id === 'nominee')!

    expect(hasEffect(updatedCursed, 'dead')).toBe(true)
    expect(hasEffect(updatedCursed, 'witch_curse')).toBe(false)
    expect(hasEffect(updatedNominee, 'dead')).toBe(false)
  })

  it('routes Evil Twin execution through the top-level win check', () => {
    const evilTwin = addEffectTo(
      makePlayer({ id: 'evil', roleId: 'evil_twin' }),
      'evil_twin_link',
      { counterpartId: 'good', isEvilTwin: true },
    )
    const goodTwin = addEffectTo(
      makePlayer({ id: 'good', roleId: 'chef' }),
      'evil_twin_link',
      { counterpartId: 'evil', isEvilTwin: false },
    )
    const state = makeState({
      phase: 'day',
      round: 3,
      players: [evilTwin, goodTwin, makePlayer({ id: 'demon', roleId: 'imp' })],
    })
    const game = makeGameWithHistory(
      [{ type: 'execution', data: { playerId: 'good' } }],
      state,
    )

    expect(checkWinCondition(state, game)).toBe('demon')
  })

  it('only exposes Cerenovus resolution while the affected player is alive', () => {
    const aliveTarget = addEffectTo(
      makePlayer({ id: 'mad', roleId: 'oracle' }),
      'cerenovus_madness',
      { madAsRoleId: 'clockmaker', cerenovusId: 'cer' },
    )
    const aliveState = makeState({
      phase: 'day',
      round: 2,
      players: [aliveTarget],
    })

    expect(
      getAvailableDayActions(aliveState, mockT).some(
        (action) => action.playerId === 'mad' && action.id.startsWith('cerenovus_madness'),
      ),
    ).toBe(true)

    const deadState = makeState({
      phase: 'day',
      round: 2,
      players: [addEffectTo(aliveTarget, 'dead')],
    })

    expect(
      getAvailableDayActions(deadState, mockT).some(
        (action) => action.playerId === 'mad' && action.id.startsWith('cerenovus_madness'),
      ),
    ).toBe(false)
  })

  it('keeps Klutz resolution available after the Klutz is dead', () => {
    const klutz = addEffectTo(
      addEffectTo(makePlayer({ id: 'klutz', roleId: 'klutz' }), 'dead'),
      'klutz_choice_pending',
    )
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [klutz, makePlayer({ id: 'imp', roleId: 'imp' })],
    })

    expect(
      getAvailableDayActions(state, mockT, 'resolution').some(
        (action) => action.playerId === 'klutz' && action.id.startsWith('klutz_resolve'),
      ),
    ).toBe(true)
  })
})
