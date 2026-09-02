import { beforeEach, describe, expect, it } from 'vitest'
import { resolveEvilInfoPlan } from '../evilInfo'
import { getRole } from '../roles'
import { getNextStep, getNightRolesStatus, processAutoSkips } from '../game'
import {
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from './helpers'

beforeEach(() => resetPlayerCounter())

const Imp = getRole('imp')!
const Baron = getRole('baron')!
const Poisoner = getRole('poisoner')!
const Spy = getRole('spy')!

describe('evil info resolver', () => {
  it('suppresses demon/minion knowledge under seven players but keeps bluffs', () => {
    const state = makeState({
      round: 1,
      players: [
        makePlayer({ id: 'demon', roleId: 'imp' }),
        makePlayer({ id: 'minion', roleId: 'baron' }),
        makePlayer({ roleId: 'washerwoman' }),
        makePlayer({ roleId: 'chef' }),
        makePlayer({ roleId: 'empath' }),
        makePlayer({ roleId: 'butler' }),
      ],
    })

    expect(resolveEvilInfoPlan(state)).toMatchObject({
      demonLearnsMinions: false,
      minionsLearnDemon: false,
      minionsLearnOtherMinions: true,
      demonLearnsBluffs: true,
    })
  })
})

describe('evil info role integration', () => {
  it('moves under-seven demon info and bluffs into Night 1 system steps', () => {
    const imp = makePlayer({ id: 'imp', roleId: 'imp' })
    const state = makeState({
      round: 1,
      players: [
        imp,
        makePlayer({ id: 'minion', roleId: 'baron' }),
        makePlayer({ roleId: 'washerwoman' }),
        makePlayer({ roleId: 'chef' }),
        makePlayer({ roleId: 'empath' }),
        makePlayer({ roleId: 'butler' }),
      ],
    })
    const game = makeGameWithHistory(
      [{ type: 'night_started', data: { round: 1 }, stateOverrides: state }],
      state,
    )

    expect(Imp.shouldWake!(game, imp)).toBe(false)
    expect(Imp.nightSteps?.find((step) => step.id === 'show_minions')).toBeUndefined()
    expect(Imp.nightSteps?.find((step) => step.id === 'show_bluffs')).toBeUndefined()

    const nextStep = getNextStep(game)
    expect(nextStep).toMatchObject({
      type: 'night_action_skip',
      playerId: 'minion',
      systemStepId: 'minion_info',
    })

    const statuses = getNightRolesStatus(game)
    expect(
      statuses.slice(0, 3).map((status) => ({
        playerId: status.playerId,
        systemStepId: status.systemStepId,
        dashboardKind: status.dashboardKind,
        status: status.status,
      })),
    ).toEqual([
      {
        playerId: 'minion',
        systemStepId: 'minion_info',
        dashboardKind: 'minion_info',
        status: 'skipped',
      },
      {
        playerId: 'imp',
        systemStepId: 'demon_info',
        dashboardKind: 'demon_info',
        status: 'skipped',
      },
      {
        playerId: 'imp',
        systemStepId: 'demon_bluffs',
        dashboardKind: 'demon_bluffs',
        status: 'pending',
      },
    ])
  })

  it('auto-skips suppressed under-seven system steps without looping and leaves bluffs pending', () => {
    const state = makeState({
      round: 1,
      players: [
        makePlayer({ id: 'demon', roleId: 'imp' }),
        makePlayer({ id: 'minion', roleId: 'baron' }),
        makePlayer({ roleId: 'washerwoman' }),
        makePlayer({ roleId: 'chef' }),
        makePlayer({ roleId: 'empath' }),
        makePlayer({ roleId: 'butler' }),
      ],
    })
    const game = makeGameWithHistory(
      [{ type: 'night_started', data: { round: 1 }, stateOverrides: state }],
      state,
    )

    const processed = processAutoSkips(game)

    const skippedSystemSteps = processed.history.filter(
      (entry) =>
        entry.type === 'night_skipped' &&
        (entry.data.systemStepId === 'minion_info' ||
          entry.data.systemStepId === 'demon_info'),
    )
    expect(skippedSystemSteps).toHaveLength(2)

    expect(getNextStep(processed)).toMatchObject({
      type: 'night_action',
      playerId: 'demon',
      systemStepId: 'demon_bluffs',
    })
  })

  it('removes passive minion first-night evil team reveals from role-local steps', () => {
    const baron = makePlayer({ id: 'baron', roleId: 'baron' })
    const spy = makePlayer({ id: 'spy', roleId: 'spy' })
    const basePlayers = [
      makePlayer({ id: 'demon', roleId: 'imp' }),
      makePlayer({ roleId: 'washerwoman' }),
      makePlayer({ roleId: 'chef' }),
      makePlayer({ roleId: 'empath' }),
      makePlayer({ roleId: 'butler' }),
    ]

    const baronState = makeState({ round: 1, players: [baron, ...basePlayers] })
    const baronGame = makeGameWithHistory(
      [{ type: 'night_started', data: { round: 1 }, stateOverrides: baronState }],
      baronState,
    )
    expect(Baron.shouldWake!(baronGame, baron)).toBe(false)

    const spyState = makeState({ round: 1, players: [spy, ...basePlayers] })
    const spyGame = makeGameWithHistory(
      [{ type: 'night_started', data: { round: 1 }, stateOverrides: spyState }],
      spyState,
    )
    expect(Spy.nightSteps!.find((step) => step.id === 'show_evil_team')).toBeUndefined()
    expect(Spy.shouldWake!(spyGame, spy)).toBe(true)
  })

  it('keeps active minion abilities available while their evil info moves to system steps', () => {
    const poisoner = makePlayer({ id: 'poisoner', roleId: 'poisoner' })
    const state = makeState({
      round: 1,
      players: [
        poisoner,
        makePlayer({ id: 'demon', roleId: 'imp' }),
        makePlayer({ roleId: 'washerwoman' }),
        makePlayer({ roleId: 'chef' }),
        makePlayer({ roleId: 'empath' }),
        makePlayer({ roleId: 'butler' }),
      ],
    })
    const game = makeGameWithHistory(
      [{ type: 'night_started', data: { round: 1 }, stateOverrides: state }],
      state,
    )

    expect(Poisoner.shouldWake!(game, poisoner)).toBe(true)
    expect(
      Poisoner.nightSteps!.map((step) => step.id),
    ).toEqual(['choose_target'])
  })
})
