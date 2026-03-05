import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyPipelineChanges,
  getAvailableDayActions,
  getAvailableNightFollowUps,
  resolveIntent,
} from '../pipeline'
import { ExecuteIntent, KillIntent } from '../pipeline/types'
import { getCurrentState, hasEffect } from '../types'
import {
  addEffectTo,
  makeGame,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from './helpers'

const mockT = {}

beforeEach(() => {
  resetPlayerCounter()
})

describe('Sects & Violets first slice', () => {
  it('Sweetheart gains a pending drunk resolution when killed', () => {
    const players = [
      addEffectTo(makePlayer({ id: 'sweet', roleId: 'sweetheart' }), 'sweetheart_trigger'),
      makePlayer({ id: 'imp', roleId: 'imp' }),
    ]
    const state = makeState({ phase: 'night', round: 2, players })
    const game = makeGame(state)

    const intent: KillIntent = {
      type: 'kill',
      sourceId: 'imp',
      targetId: 'sweet',
      cause: 'demon',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const updatedPlayer = getCurrentState(updated).players.find((player) => player.id === 'sweet')
    expect(updatedPlayer).toBeDefined()
    expect(hasEffect(updatedPlayer!, 'dead')).toBe(true)
    expect(hasEffect(updatedPlayer!, 'sweetheart_pending')).toBe(true)
  })

  it('Sage only gains a pending reveal when killed by a demon', () => {
    const demonState = makeState({ phase: 'night', round: 2, players: [
      addEffectTo(makePlayer({ id: 'sage', roleId: 'sage' }), 'sage_trigger'),
      makePlayer({ id: 'imp', roleId: 'imp' }),
      makePlayer({ id: 'chef', roleId: 'chef' }),
    ] })
    const demonGame = makeGame(demonState)
    const demonKill: KillIntent = {
      type: 'kill',
      sourceId: 'imp',
      targetId: 'sage',
      cause: 'demon',
    }
    const demonResult = resolveIntent(demonKill, demonState, demonGame)
    expect(demonResult.type).toBe('resolved')
    if (demonResult.type === 'resolved') {
      const updated = applyPipelineChanges(demonGame, demonResult.stateChanges)
      const sage = getCurrentState(updated).players.find((player) => player.id === 'sage')!
      const pending = sage.effects.find((effect) => effect.type === 'sage_pending')
      expect(pending?.data?.demonId).toBe('imp')
    }

    const nonDemonState = makeState({
      phase: 'night',
      round: 2,
      players: [
        addEffectTo(makePlayer({ id: 'sage', roleId: 'sage' }), 'sage_trigger'),
        makePlayer({ id: 'chef', roleId: 'chef' }),
      ],
    })
    const nonDemonGame = makeGame(nonDemonState)
    const nonDemonKill: KillIntent = {
      type: 'kill',
      sourceId: 'chef',
      targetId: 'sage',
      cause: 'ability',
    }
    const nonDemonResult = resolveIntent(nonDemonKill, nonDemonState, nonDemonGame)
    expect(nonDemonResult.type).toBe('resolved')
    if (nonDemonResult.type === 'resolved') {
      const updated = applyPipelineChanges(nonDemonGame, nonDemonResult.stateChanges)
      const sage = getCurrentState(updated).players.find((player) => player.id === 'sage')!
      const pending = sage.effects.find((effect) => effect.type === 'sage_pending')
      expect(pending?.data?.demonId).toBeUndefined()
    }
  })

  it('Klutz gains a pending public choice only when executed', () => {
    const players = [
      addEffectTo(makePlayer({ id: 'klutz', roleId: 'klutz' }), 'klutz_trigger'),
      makePlayer({ id: 'imp', roleId: 'imp' }),
    ]
    const state = makeState({ phase: 'day', round: 2, players })
    const game = makeGame(state)

    const intent: ExecuteIntent = {
      type: 'execute',
      playerId: 'klutz',
      cause: 'execution',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const klutz = getCurrentState(updated).players.find((player) => player.id === 'klutz')!
    expect(hasEffect(klutz, 'klutz_choice_pending')).toBe(true)
    expect(hasEffect(klutz, 'dead')).toBe(true)
  })

  it('Mutant exposes a standard day action while alive and never as an end-of-day resolution', () => {
    const aliveState = makeState({
      phase: 'day',
      round: 2,
      players: [
        addEffectTo(makePlayer({ id: 'mutant', roleId: 'mutant' }), 'mutant_execution'),
      ],
    })

    const allActions = getAvailableDayActions(aliveState, mockT)
    const resolutionActions = getAvailableDayActions(aliveState, mockT, 'resolution')

    expect(allActions.some((action) => action.playerId === 'mutant')).toBe(true)
    expect(resolutionActions.some((action) => action.playerId === 'mutant')).toBe(false)

    const deadState = makeState({
      phase: 'day',
      round: 2,
      players: [
        addEffectTo(
          addEffectTo(makePlayer({ id: 'mutant', roleId: 'mutant' }), 'mutant_execution'),
          'dead',
        ),
      ],
    })

    expect(getAvailableDayActions(deadState, mockT)).toHaveLength(0)
  })

  it('Barber creates both day and night follow-up resolution surfaces after death', () => {
    const players = [
      addEffectTo(makePlayer({ id: 'barber', roleId: 'barber' }), 'barber_trigger'),
      makePlayer({ id: 'imp', roleId: 'imp' }),
      makePlayer({ id: 'chef', roleId: 'chef' }),
    ]
    const state = makeState({ phase: 'night', round: 2, players })
    const game = makeGame(state)

    const intent: KillIntent = {
      type: 'kill',
      sourceId: 'imp',
      targetId: 'barber',
      cause: 'demon',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const updatedState = getCurrentState(updated)

    expect(
      getAvailableDayActions(updatedState, mockT, 'resolution').some(
        (action) => action.playerId === 'barber',
      ),
    ).toBe(true)
    expect(
      getAvailableNightFollowUps(updatedState, updated, mockT).some(
        (followUp) => followUp.playerId === 'barber',
      ),
    ).toBe(true)
  })
})
