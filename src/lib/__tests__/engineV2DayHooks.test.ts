import { describe, expect, it } from 'vitest'

import {
  createAliveLifeState,
  createDayCastVoteIntent,
  createDayOpenVoteIntent,
  createDayStartNominationIntent,
  createDayResolveExecutionIntent,
  createEngineState,
  createLethalIntent,
  createRoleChangeIntent,
  getRoleTriggerOccurrenceFromTriggerEvent,
  resolveEngineIntent,
  runLethalIntent,
  setEnginePhase,
  type EnginePlayer,
} from '../engine-v2'

function createPlayer(
  id: string,
  roleId: string,
  alignment: 'good' | 'evil' = 'good',
): EnginePlayer {
  return {
    id,
    name: id,
    roleId,
    alignment,
    life: createAliveLifeState(),
  }
}

function getRecordedTriggerTypes(state: ReturnType<typeof createEngineState>): string[] {
  return state.events
    .filter((event) => event.type === 'trigger_recorded')
    .map((event) => event.triggerEvent.type)
}

describe('engine-v2 day hook model', () => {
  it('maps execution-resolved, execution-skipped, and day-ended triggers to role occurrences', () => {
    const state = createEngineState([createPlayer('target', 'dreamer')], 'day')

    const resolved = getRoleTriggerOccurrenceFromTriggerEvent(state, {
      type: 'execution_resolved',
      playerId: 'target',
      data: { nominationId: 'nomination-1' },
    })
    const skipped = getRoleTriggerOccurrenceFromTriggerEvent(state, {
      type: 'execution_skipped',
      data: { tied: true },
    })
    const ended = getRoleTriggerOccurrenceFromTriggerEvent(state, {
      type: 'day_ended',
      data: { noExecution: true },
    })

    expect(resolved).toMatchObject({
      name: 'onExecutionResolved',
      subject: {
        kind: 'player',
        playerId: 'target',
        phase: 'execution',
      },
    })
    expect(skipped).toMatchObject({
      name: 'onExecutionSkipped',
      subject: { kind: 'phase', phase: 'end_of_day' },
    })
    expect(ended).toMatchObject({
      name: 'onDayEnded',
      subject: { kind: 'phase', phase: 'end_of_day' },
    })
  })

  it('records execution_resolved before player_executed and day_ended when an execution happens', () => {
    const executed = runLethalIntent(
      createEngineState([
        createPlayer('storyteller', 'storyteller'),
        createPlayer('target', 'dreamer'),
      ], 'day'),
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'storyteller',
        targetPlayerId: 'target',
        cause: 'execution',
        phase: 'execution',
        reason: 'Test execution',
      }),
    ).state

    const withBlock = {
      ...executed,
      day: {
        ...executed.day,
        block: {
          nomineeId: 'target',
          voteCount: 3,
          tied: false,
          nominationId: 'nomination-1',
        },
      },
    }

    const resolved = resolveEngineIntent(
      withBlock,
      createDayResolveExecutionIntent({ reason: 'Resolve block' }),
    )

    expect(getRecordedTriggerTypes(resolved)).toEqual(
      expect.arrayContaining([
        'execution_resolved',
        'player_executed',
        'day_ended',
      ]),
    )
  })

  it('records execution_skipped, no_execution, and day_ended when the block is tied', () => {
    const state = createEngineState([
      createPlayer('a', 'dreamer'),
      createPlayer('b', 'clockmaker'),
    ], 'day')

    const tied = {
      ...state,
      day: {
        ...state.day,
        block: {
          nomineeId: null,
          voteCount: 2,
          tied: true,
          nominationId: null,
        },
      },
    }

    const resolved = resolveEngineIntent(
      tied,
      createDayResolveExecutionIntent({ reason: 'Tie on the block' }),
    )

    expect(getRecordedTriggerTypes(resolved)).toEqual(
      expect.arrayContaining([
        'execution_skipped',
        'no_execution',
        'day_ended',
      ]),
    )
  })

  it('tracks Flowergirl and Town Crier state from live day events', () => {
    let state = createEngineState([
      createPlayer('flowergirl', 'flowergirl'),
      createPlayer('town_crier', 'town_crier'),
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('witch', 'witch', 'evil'),
      createPlayer('villager', 'dreamer'),
    ], 'day')

    state = resolveEngineIntent(
      state,
      createDayStartNominationIntent({
        nominatorId: 'witch',
        nomineeId: 'villager',
      }),
    )
    const nominationId = state.day.currentNominationId
    expect(nominationId).toBeTruthy()

    state = resolveEngineIntent(
      state,
      createDayOpenVoteIntent({ nominationId: nominationId! }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'imp' }),
    )

    expect(
      state.players.find((player) => player.id === 'flowergirl')?.notes
        ?.flowergirlDemonVotedToday,
    ).toBe(true)
    expect(
      state.players.find((player) => player.id === 'town_crier')?.notes
        ?.townCrierMinionNominatedToday,
    ).toBe(true)
  })

  it('initializes Flowergirl and Town Crier day notes when they enter play mid-day', () => {
    let state = createEngineState([
      createPlayer('becomes_flowergirl', 'dreamer'),
      createPlayer('becomes_town_crier', 'oracle'),
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('witch', 'witch', 'evil'),
      createPlayer('villager', 'clockmaker'),
    ], 'day')

    state = resolveEngineIntent(
      state,
      createDayStartNominationIntent({
        nominatorId: 'witch',
        nomineeId: 'villager',
      }),
    )
    const nominationId = state.day.currentNominationId
    expect(nominationId).toBeTruthy()

    state = resolveEngineIntent(
      state,
      createDayOpenVoteIntent({ nominationId: nominationId! }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'imp' }),
    )

    state = resolveEngineIntent(
      state,
      createRoleChangeIntent({
        playerId: 'becomes_flowergirl',
        newRoleId: 'flowergirl',
        reason: 'Test transformation',
      }),
    )
    state = resolveEngineIntent(
      state,
      createRoleChangeIntent({
        playerId: 'becomes_town_crier',
        newRoleId: 'town_crier',
        reason: 'Test transformation',
      }),
    )

    expect(
      state.players.find((player) => player.id === 'becomes_flowergirl')?.notes
        ?.flowergirlDemonVotedToday,
    ).toBe(true)
    expect(
      state.players.find((player) => player.id === 'becomes_town_crier')?.notes
        ?.townCrierMinionNominatedToday,
    ).toBe(true)
  })

  it('clears Flowergirl and Town Crier tracked day notes at the next day start', () => {
    let state = createEngineState([
      createPlayer('flowergirl', 'flowergirl'),
      createPlayer('town_crier', 'town_crier'),
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('witch', 'witch', 'evil'),
      createPlayer('villager', 'dreamer'),
    ], 'day')

    state = resolveEngineIntent(
      state,
      createDayStartNominationIntent({
        nominatorId: 'witch',
        nomineeId: 'villager',
      }),
    )
    const nominationId = state.day.currentNominationId
    expect(nominationId).toBeTruthy()

    state = resolveEngineIntent(
      state,
      createDayOpenVoteIntent({ nominationId: nominationId! }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'imp' }),
    )

    const nextDay = setEnginePhase(setEnginePhase(state, 'other_night'), 'day')

    expect(
      nextDay.players.find((player) => player.id === 'flowergirl')?.notes
        ?.flowergirlDemonVotedToday,
    ).toBeUndefined()
    expect(
      nextDay.players.find((player) => player.id === 'town_crier')?.notes
        ?.townCrierMinionNominatedToday,
    ).toBeUndefined()
  })

  it('initializes Undertaker execution tracking when Undertaker enters play after an execution', () => {
    const base = createEngineState([
      createPlayer('becomes_undertaker', 'dreamer'),
      createPlayer('target', 'clockmaker'),
      createPlayer('other', 'imp', 'evil'),
    ], 'day')

    const executed = resolveEngineIntent(
      {
        ...base,
        day: {
          ...base.day,
          block: {
            nomineeId: 'target',
            voteCount: 4,
            tied: false,
            nominationId: 'nomination-1',
          },
        },
      },
      createDayResolveExecutionIntent({ reason: 'Execute target.' }),
    )

    const entered = resolveEngineIntent(
      setEnginePhase(executed, 'other_night'),
      createRoleChangeIntent({
        playerId: 'becomes_undertaker',
        newRoleId: 'undertaker',
        reason: 'Test transformation into Undertaker',
      }),
    )

    const transformed = entered.players.find(
      (player) => player.id === 'becomes_undertaker',
    )

    expect(transformed?.notes?.undertakerExecutedPlayerId).toBe('target')
    expect(transformed?.notes?.undertakerExecutedRoleId).toBe('clockmaker')
    expect(
      entered.pendingInformation.some(
        (packet) =>
          packet.title === 'Undertaker' &&
          packet.playerId === 'becomes_undertaker',
      ),
    ).toBe(true)
  })
})
