import { runLethalIntent } from './runLethalIntent'
import { cloneEngineState, getPlayer, type EngineState } from './state'
import { recordTriggerEvent } from './scheduler'
import type {
  DayBlockState,
  DayExecutionState,
  DayNominationRecord,
  EngineEvent,
  LethalIntent,
  TriggerEvent,
} from './types'

let nextNominationId = 1
let nextDayIntentId = 1

function createNominationId(): string {
  return `nomination-${nextNominationId++}`
}

function createDayExecutionIntent(input: Omit<LethalIntent, 'id'>): LethalIntent {
  return {
    id: `day-execution-${nextDayIntentId++}`,
    ...input,
  }
}

function appendDayEvent(state: EngineState, event: EngineEvent): EngineState {
  return {
    ...state,
    events: [...state.events, event],
  }
}

function findNomination(
  state: EngineState,
  nominationId: string,
): DayNominationRecord | undefined {
  return state.day.nominations.find((nomination) => nomination.id === nominationId)
}

function updateNomination(
  state: EngineState,
  nominationId: string,
  updater: (nomination: DayNominationRecord) => DayNominationRecord,
): EngineState {
  return {
    ...state,
    day: {
      ...state.day,
      nominations: state.day.nominations.map((nomination) =>
        nomination.id === nominationId ? updater(nomination) : nomination,
      ),
    },
  }
}

function buildBlockState(
  previousBlock: DayBlockState,
  nomination: DayNominationRecord,
): DayBlockState {
  const totalVotes = nomination.votes.length + nomination.ghostVotes.length

  if (totalVotes <= 0) {
    return previousBlock
  }

  if (totalVotes > previousBlock.voteCount) {
    return {
      nomineeId: nomination.nomineeId,
      voteCount: totalVotes,
      tied: false,
      nominationId: nomination.id,
    }
  }

  if (
    totalVotes === previousBlock.voteCount &&
    previousBlock.nomineeId &&
    previousBlock.nomineeId !== nomination.nomineeId
  ) {
    return {
      nomineeId: null,
      voteCount: totalVotes,
      tied: true,
      nominationId: null,
    }
  }

  return previousBlock
}

function toExecutionState(
  status: DayExecutionState['status'],
  executedPlayerId: string | null,
  nominationId?: string | null,
  reason?: string,
): DayExecutionState {
  return {
    status,
    executedPlayerId,
    nominationId: nominationId ?? null,
    reason,
  }
}

export function startNomination(
  state: EngineState,
  input: {
    nominatorId: string
    nomineeId: string
  },
): EngineState {
  if (state.phase !== 'day') {
    return state
  }

  const nominator = getPlayer(state, input.nominatorId)
  const nominee = getPlayer(state, input.nomineeId)
  if (!nominator || !nominee || input.nominatorId === input.nomineeId) {
    return state
  }
  if (
    nominator.life.projection.canNominate !== true ||
    nominee.life.projection.publicState !== 'alive' ||
    state.day.votingOpen
  ) {
    return state
  }

  const nomination: DayNominationRecord = {
    id: createNominationId(),
    nominatorId: input.nominatorId,
    nomineeId: input.nomineeId,
    votes: [],
    ghostVotes: [],
    status: 'opened',
    createdAtEventIndex: state.events.length,
  }

  let nextState: EngineState = {
    ...state,
    day: {
      ...state.day,
      currentNominationId: nomination.id,
      votingOpen: false,
      nominations: [...state.day.nominations, nomination],
    },
  }

  nextState = appendDayEvent(nextState, {
    type: 'day_nomination_started',
    nomination,
  })

  return recordTriggerEvent(nextState, {
    type: 'nomination_started',
    playerId: input.nominatorId,
    data: {
      nominationId: nomination.id,
      nomineeId: input.nomineeId,
    },
  })
}

export function lockNomination(
  state: EngineState,
  nominationId: string,
): EngineState {
  const nomination = findNomination(state, nominationId)
  if (!nomination || nomination.status !== 'opened') {
    return state
  }

  let nextState = appendDayEvent(state, {
    type: 'day_nomination_locked',
    nominationId,
  })

  return recordTriggerEvent(nextState, {
    type: 'nomination_locked',
    playerId: nomination.nomineeId,
    data: {
      nominationId,
      nominatorId: nomination.nominatorId,
    },
  })
}

export function openVote(
  state: EngineState,
  nominationId: string,
): EngineState {
  const nomination = findNomination(state, nominationId)
  if (!nomination || nomination.status !== 'opened') {
    return state
  }

  let nextState: EngineState = {
    ...state,
    day: {
      ...state.day,
      currentNominationId: nominationId,
      votingOpen: true,
    },
  }

  nextState = appendDayEvent(nextState, {
    type: 'day_vote_opened',
    nominationId,
  })

  return recordTriggerEvent(nextState, {
    type: 'vote_opened',
    playerId: nomination.nomineeId,
    data: {
      nominationId,
      nominatorId: nomination.nominatorId,
    },
  })
}

export function castVote(
  state: EngineState,
  input: {
    nominationId: string
    voterId: string
  },
): EngineState {
  const nomination = findNomination(state, input.nominationId)
  const voter = getPlayer(state, input.voterId)
  if (!nomination || nomination.status !== 'opened' || !state.day.votingOpen || !voter) {
    return state
  }

  if (nomination.votes.includes(input.voterId) || nomination.ghostVotes.includes(input.voterId)) {
    return state
  }

  const publiclyAlive = voter.life.projection.publicState === 'alive'
  const canSpendGhostVote =
    voter.life.projection.publicState === 'dead' &&
    !state.day.ghostVotesSpentByPlayerId[input.voterId]

  if (!publiclyAlive && !canSpendGhostVote) {
    return state
  }

  const ghostVote = !publiclyAlive
  let nextState = updateNomination(state, input.nominationId, (current) => ({
    ...current,
    votes: ghostVote ? current.votes : [...current.votes, input.voterId],
    ghostVotes: ghostVote ? [...current.ghostVotes, input.voterId] : current.ghostVotes,
  }))

  if (ghostVote) {
    nextState = {
      ...nextState,
      day: {
        ...nextState.day,
        ghostVotesSpentByPlayerId: {
          ...nextState.day.ghostVotesSpentByPlayerId,
          [input.voterId]: true,
        },
      },
    }
  }

  nextState = appendDayEvent(nextState, {
    type: 'day_vote_cast',
    nominationId: input.nominationId,
    voterId: input.voterId,
    ghostVote,
  })

  return recordTriggerEvent(nextState, {
    type: 'vote_cast',
    playerId: input.voterId,
    data: {
      nominationId: input.nominationId,
      nomineeId: nomination.nomineeId,
      ghostVote,
    },
  })
}

export function closeVote(
  state: EngineState,
  nominationId: string,
): EngineState {
  const nomination = findNomination(state, nominationId)
  if (!nomination || nomination.status !== 'opened') {
    return state
  }

  const closedNomination = {
    ...nomination,
    status: 'closed' as const,
    closedAtEventIndex: state.events.length,
  }

  let nextState = updateNomination(state, nominationId, () => closedNomination)
  nextState = {
    ...nextState,
    day: {
      ...nextState.day,
      votingOpen: false,
      currentNominationId: null,
      block: buildBlockState(nextState.day.block, closedNomination),
    },
  }

  const totalVotes = closedNomination.votes.length + closedNomination.ghostVotes.length

  nextState = appendDayEvent(nextState, {
    type: 'day_vote_closed',
    nominationId,
    voteCount: closedNomination.votes.length,
    ghostVoteCount: closedNomination.ghostVotes.length,
    totalVotes,
  })
  nextState = recordTriggerEvent(nextState, {
    type: 'vote_closed',
    playerId: closedNomination.nomineeId,
    data: {
      nominationId,
      nominatorId: closedNomination.nominatorId,
      totalVotes,
    },
  })

  nextState = appendDayEvent(nextState, {
    type: 'day_block_updated',
    block: nextState.day.block,
  })

  return recordTriggerEvent(nextState, {
    type: 'block_updated',
    playerId: nextState.day.block.nomineeId ?? undefined,
    data: {
      nominationId: nextState.day.block.nominationId,
      voteCount: nextState.day.block.voteCount,
      tied: nextState.day.block.tied,
    },
  })
}

export function resolveExecution(
  state: EngineState,
  reason?: string,
): EngineState {
  const block = state.day.block

  if (!block.nomineeId || block.tied || block.voteCount <= 0) {
    let nextState: EngineState = {
      ...state,
      day: {
        ...state.day,
        execution: toExecutionState('skipped', null, null, reason),
      },
    }

    nextState = appendDayEvent(nextState, {
      type: 'day_execution_skipped',
      reason,
    })
    nextState = recordTriggerEvent(nextState, {
      type: 'execution_skipped',
      data: {
        reason,
        voteCount: block.voteCount,
        tied: block.tied,
      },
    })
    nextState = recordTriggerEvent(nextState, {
      type: 'no_execution',
      data: {
        reason,
        voteCount: block.voteCount,
        tied: block.tied,
      },
    })

    return recordTriggerEvent(nextState, {
      type: 'day_ended',
      data: {
        reason,
        executedPlayerId: null,
        noExecution: true,
        voteCount: block.voteCount,
        tied: block.tied,
      },
    })
  }

  const executionIntent = createDayExecutionIntent({
    kind: 'execute',
    sourcePlayerId: 'storyteller',
    targetPlayerId: block.nomineeId,
    cause: 'execution',
    phase: 'execution',
    reason,
  })

  let nextState = runLethalIntent(state, executionIntent).state
  nextState = {
    ...nextState,
    day: {
      ...nextState.day,
      execution: toExecutionState('resolved', block.nomineeId, block.nominationId, reason),
    },
  }

  nextState = appendDayEvent(nextState, {
    type: 'day_execution_resolved',
    executedPlayerId: block.nomineeId,
    nominationId: block.nominationId,
    reason,
  })
  nextState = recordTriggerEvent(nextState, {
    type: 'execution_resolved',
    playerId: block.nomineeId,
    data: {
      nominationId: block.nominationId,
      voteCount: block.voteCount,
      reason,
    },
  })
  nextState = recordTriggerEvent(nextState, {
    type: 'player_executed',
    playerId: block.nomineeId,
    data: {
      nominationId: block.nominationId,
      voteCount: block.voteCount,
      reason,
    },
  })

  return recordTriggerEvent(nextState, {
    type: 'day_ended',
    playerId: block.nomineeId,
    data: {
      executedPlayerId: block.nomineeId,
      nominationId: block.nominationId,
      voteCount: block.voteCount,
      reason,
      noExecution: false,
    },
  })
}

export function resolveSpecialExecution(
  state: EngineState,
  input: {
    executedPlayerId: string
    nominationId?: string | null
    sourcePlayerId?: string
    reason: string
  },
): EngineState {
  const nextNominations =
    input.nominationId == null
      ? state.day.nominations
      : state.day.nominations.map((nomination) =>
          nomination.id === input.nominationId
            ? {
                ...nomination,
                status: 'closed' as const,
                closedAtEventIndex: state.events.length,
              }
            : nomination,
        )

  const executionIntent = createDayExecutionIntent({
    kind: 'execute',
    sourcePlayerId: input.sourcePlayerId ?? 'storyteller',
    targetPlayerId: input.executedPlayerId,
    cause: 'execution',
    phase: 'execution',
    reason: input.reason,
  })

  let nextState = runLethalIntent(state, executionIntent).state
  nextState = {
    ...nextState,
    day: {
      ...nextState.day,
      nominations: nextNominations,
      currentNominationId: null,
      votingOpen: false,
      execution: toExecutionState(
        'resolved',
        input.executedPlayerId,
        input.nominationId ?? null,
        input.reason,
      ),
    },
  }

  nextState = appendDayEvent(nextState, {
    type: 'day_execution_resolved',
    executedPlayerId: input.executedPlayerId,
    nominationId: input.nominationId ?? null,
    reason: input.reason,
  })
  nextState = recordTriggerEvent(nextState, {
    type: 'execution_resolved',
    playerId: input.executedPlayerId,
    data: {
      nominationId: input.nominationId ?? null,
      voteCount: 0,
      reason: input.reason,
      specialExecution: true,
    },
  })
  nextState = recordTriggerEvent(nextState, {
    type: 'player_executed',
    playerId: input.executedPlayerId,
    data: {
      nominationId: input.nominationId ?? null,
      voteCount: 0,
      reason: input.reason,
      specialExecution: true,
    },
  })

  return recordTriggerEvent(nextState, {
    type: 'day_ended',
    playerId: input.executedPlayerId,
    data: {
      executedPlayerId: input.executedPlayerId,
      nominationId: input.nominationId ?? null,
      voteCount: 0,
      reason: input.reason,
      noExecution: false,
      specialExecution: true,
    },
  })
}

export function startDay(state: EngineState): EngineState {
  const base = cloneEngineState(state)
  return recordTriggerEvent(base, {
    type: 'day_started',
    phase: 'day',
  } satisfies TriggerEvent)
}
