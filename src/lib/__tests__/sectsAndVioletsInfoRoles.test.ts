import { beforeEach, describe, expect, it } from 'vitest'
import { addEffectTo, makeGameWithHistory, makePlayer, makeState, resetPlayerCounter } from './helpers'
import {
  countClosestMinionDistance,
  countDeadEvilPlayers,
  playersShareAlignment,
  didDemonVoteToday,
  didMinionNominateToday,
} from '../roles/definition/sects-and-violets/helpers'
import { getDreamerSelectableTargets } from '../roles/definition/sects-and-violets/dreamer'
import { getRole } from '../roles'
import { getPhilosopherQueuePolicyForChosenRole } from '../roles/definition/sects-and-violets/philosopher'

beforeEach(() => {
  resetPlayerCounter()
})

describe('Sects & Violets info roles', () => {
  it('Clockmaker finds the closest demon-minion distance around the circle', () => {
    const state = makeState({
      players: [
        makePlayer({ id: 'p1', roleId: 'clockmaker' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'poisoner' }),
        makePlayer({ id: 'p4', roleId: 'villager' }),
        makePlayer({ id: 'p5', roleId: 'imp' }),
        makePlayer({ id: 'p6', roleId: 'baron' }),
      ],
    })

    expect(countClosestMinionDistance(state)).toBe(1)
  })

  it('Clockmaker uses the shortest circular path across seat 0', () => {
    const state = makeState({
      players: [
        makePlayer({ id: 'minion_start', roleId: 'witch' }),
        makePlayer({ id: 'town_1', roleId: 'villager' }),
        makePlayer({ id: 'town_2', roleId: 'villager' }),
        makePlayer({ id: 'town_3', roleId: 'villager' }),
        makePlayer({ id: 'demon_end', roleId: 'fang_gu' }),
      ],
    })

    expect(countClosestMinionDistance(state)).toBe(1)
  })

  it('Oracle counts dead evil players', () => {
    const oracle = makePlayer({ id: 'oracle', roleId: 'oracle' })
    const state = makeState({
      players: [
        oracle,
        addEffectTo(makePlayer({ id: 'evil_dead', roleId: 'poisoner' }), 'dead'),
        addEffectTo(makePlayer({ id: 'good_dead', roleId: 'villager' }), 'dead'),
        makePlayer({ id: 'alive_evil', roleId: 'imp' }),
      ],
    })

    expect(countDeadEvilPlayers(state, oracle)).toBe(1)
  })

  it('Seamstress compares perceived alignments', () => {
    const seamstress = makePlayer({ id: 'seamstress', roleId: 'seamstress' })
    const state = makeState({
      players: [
        seamstress,
        makePlayer({ id: 'good_one', roleId: 'villager' }),
        makePlayer({ id: 'good_two', roleId: 'mayor' }),
        makePlayer({ id: 'evil_one', roleId: 'imp' }),
      ],
    })

    expect(playersShareAlignment(state, seamstress, 'good_one', 'good_two')).toBe(true)
    expect(playersShareAlignment(state, seamstress, 'good_one', 'evil_one')).toBe(false)
  })

  it('Flowergirl detects when the demon voted during the previous day', () => {
    const players = [
      makePlayer({ id: 'flowergirl', roleId: 'flowergirl' }),
      makePlayer({ id: 'imp', roleId: 'imp' }),
      makePlayer({ id: 'villager', roleId: 'villager' }),
    ]
    const state = makeState({ phase: 'night', round: 2, players })
    const game = makeGameWithHistory(
      [
        { type: 'game_created', stateOverrides: state },
        { type: 'day_started', stateOverrides: { phase: 'day', round: 1 } },
        {
          type: 'vote',
          data: {
            nomineeId: 'villager',
            voteCount: 2,
            votedIds: ['imp'],
          },
        },
        { type: 'night_started', stateOverrides: { phase: 'night', round: 2 } },
      ],
      state,
    )

    expect(didDemonVoteToday(game)).toBe(true)
  })

  it('Town Crier detects when a minion nominated during the previous day', () => {
    const players = [
      makePlayer({ id: 'town_crier', roleId: 'town_crier' }),
      makePlayer({ id: 'minion', roleId: 'poisoner' }),
      makePlayer({ id: 'villager', roleId: 'villager' }),
    ]
    const state = makeState({ phase: 'night', round: 2, players })
    const game = makeGameWithHistory(
      [
        { type: 'game_created', stateOverrides: state },
        { type: 'day_started', stateOverrides: { phase: 'day', round: 1 } },
        {
          type: 'nomination',
          data: {
            nominatorId: 'minion',
            nomineeId: 'villager',
          },
        },
        { type: 'night_started', stateOverrides: { phase: 'night', round: 2 } },
      ],
      state,
    )

    expect(didMinionNominateToday(game)).toBe(true)
  })

  it('Dreamer cannot target self', () => {
    const state = makeState({
      players: [
        makePlayer({ id: 'dreamer', roleId: 'dreamer' }),
        makePlayer({ id: 'other', roleId: 'villager' }),
      ],
    })

    const targetIds = getDreamerSelectableTargets(state, 'dreamer').map(
      (player) => player.id,
    )

    expect(targetIds).toEqual(['other'])
  })

  it('Philosopher queues gained night-action roles for immediate wake', () => {
    const clockmaker = getRole('clockmaker')
    expect(clockmaker).toBeDefined()
    if (!clockmaker) return

    expect(getPhilosopherQueuePolicyForChosenRole(clockmaker)).toBe(
      'act_immediately_force',
    )
  })

  it('Philosopher does not queue gained roles without a night action', () => {
    const artist = getRole('artist')
    expect(artist).toBeDefined()
    if (!artist) return

    expect(getPhilosopherQueuePolicyForChosenRole(artist)).toBeUndefined()
  })
})
