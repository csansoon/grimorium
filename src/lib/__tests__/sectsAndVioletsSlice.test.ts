import { beforeEach, describe, expect, it } from 'vitest'
import { getRole } from '../roles'
import {
  applyPipelineChanges,
  getAvailableDayActions,
  getAvailableNightFollowUps,
  resolveIntent,
} from '../pipeline'
import { ExecuteIntent, KillIntent, NominateIntent } from '../pipeline/types'
import { getCurrentState, hasEffect } from '../types'
import { getNextStep } from '../game'
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

  it('Klutz gains a pending public choice when killed at night', () => {
    const players = [
      addEffectTo(makePlayer({ id: 'klutz', roleId: 'klutz' }), 'klutz_trigger'),
      makePlayer({ id: 'imp', roleId: 'imp' }),
    ]
    const state = makeState({ phase: 'night', round: 2, players })
    const game = makeGame(state)

    const intent: KillIntent = {
      type: 'kill',
      sourceId: 'imp',
      targetId: 'klutz',
      cause: 'demon',
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

  it('Barber creates a demon-scoped night follow-up after death and no day resolution action', () => {
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
        (action) => action.playerId === 'barber' || action.playerId === 'imp',
      ),
    ).toBe(false)
    expect(
      getAvailableNightFollowUps(updatedState, updated, mockT).some(
        (followUp) => followUp.playerId === 'imp',
      ),
    ).toBe(true)
  })

  it('Witch-cursed Barber nomination still creates demon-scoped Barber follow-up', () => {
    const barber = addEffectTo(
      addEffectTo(
        makePlayer({ id: 'barber', roleId: 'barber' }),
        'barber_trigger',
      ),
      'witch_curse',
      { witchId: 'witch' },
      'end_of_day',
    )
    const players = [
      barber,
      makePlayer({ id: 'fang', roleId: 'fang_gu' }),
      makePlayer({ id: 'witch', roleId: 'witch' }),
      makePlayer({ id: 'town', roleId: 'chef' }),
    ]
    const state = makeState({ phase: 'day', round: 2, players })
    const game = makeGame(state)

    const intent: NominateIntent = {
      type: 'nominate',
      nominatorId: 'barber',
      nomineeId: 'town',
    }

    const result = resolveIntent(intent, state, game)
    expect(result.type).toBe('resolved')
    if (result.type !== 'resolved') return

    const updated = applyPipelineChanges(game, result.stateChanges)
    const updatedState = getCurrentState(updated)
    const followUps = getAvailableNightFollowUps(updatedState, updated, mockT)

    expect(followUps.some((followUp) => followUp.playerId === 'fang')).toBe(true)
  })

  it('Barber skip logging does not consume the demon night action', () => {
    const fang = addEffectTo(
      makePlayer({ id: 'fang', roleId: 'fang_gu' }),
      'barber_swap_pending',
      { barberId: 'barber' },
    )
    const players = [
      makePlayer({ id: 'barber', roleId: 'barber' }),
      fang,
      makePlayer({ id: 'town', roleId: 'chef' }),
    ]
    const state = makeState({ phase: 'night', round: 2, players })
    const game = makeGame(state)

    const skippedBarberFollowUp = applyPipelineChanges(game, {
      entries: [
        {
          type: 'night_action',
          message: [{ type: 'text', content: 'Barber swap skipped.' }],
          data: {
            roleId: 'barber',
            playerId: 'fang',
            action: 'barber_no_swap',
            sourcePlayerId: 'barber',
          },
        },
      ],
      removeEffects: {
        fang: ['barber_swap_pending'],
      },
    })

    const nextStep = getNextStep(skippedBarberFollowUp)
    expect(nextStep.type).toBe('night_action')
    if (nextStep.type !== 'night_action') return

    expect(nextStep.playerId).toBe('fang')
    expect(nextStep.roleId).toBe('fang_gu')
  })

  it('Witch does not wake when only 3 players are alive', () => {
    const witchRole = getRole('witch')
    expect(witchRole).toBeDefined()
    if (!witchRole?.shouldWake) return

    const witch = makePlayer({ id: 'witch', roleId: 'witch' })
    const threeAliveState = makeState({
      phase: 'night',
      round: 3,
      players: [
        witch,
        makePlayer({ id: 'demon', roleId: 'fang_gu' }),
        makePlayer({ id: 'town', roleId: 'chef' }),
        addEffectTo(makePlayer({ id: 'deadTown', roleId: 'washerwoman' }), 'dead'),
      ],
    })
    const threeAliveGame = makeGame(threeAliveState)

    const fourAliveState = makeState({
      phase: 'night',
      round: 3,
      players: [
        witch,
        makePlayer({ id: 'demon', roleId: 'fang_gu' }),
        makePlayer({ id: 'town', roleId: 'chef' }),
        makePlayer({ id: 'town2', roleId: 'washerwoman' }),
      ],
    })
    const fourAliveGame = makeGame(fourAliveState)

    expect(witchRole.shouldWake(fourAliveGame, witch)).toBe(true)
    expect(witchRole.shouldWake(threeAliveGame, witch)).toBe(false)
  })
})
