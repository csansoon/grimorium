import { processAftermath } from './aftermath'
import { cloneEngineState, getPlayer, updatePlayer, type EngineState } from './state'
import type { EngineEvent } from './types'

export function changePlayerRole(
  state: EngineState,
  input: {
    playerId: string
    newRoleId: string
    reason?: string
  },
): EngineState {
  const target = getPlayer(state, input.playerId)
  if (!target || target.roleId === input.newRoleId) {
    return state
  }

  const nextState = updatePlayer(cloneEngineState(state), input.playerId, (player) => ({
    ...player,
    roleId: input.newRoleId,
  }))

  const event = {
    type: 'player_role_changed',
    playerId: input.playerId,
    previousRoleId: target.roleId,
    newRoleId: input.newRoleId,
    reason: input.reason,
  } satisfies EngineEvent

  const eventState = {
    ...nextState,
    events: [...nextState.events, event],
  }

  return processAftermath(eventState, [event]).state
}

export function changePlayerAlignment(
  state: EngineState,
  input: {
    playerId: string
    newAlignment: 'good' | 'evil'
    reason?: string
  },
): EngineState {
  const target = getPlayer(state, input.playerId)
  if (!target || target.alignment === input.newAlignment) {
    return state
  }

  const nextState = updatePlayer(cloneEngineState(state), input.playerId, (player) => ({
    ...player,
    alignment: input.newAlignment,
  }))

  const event = {
    type: 'player_alignment_changed',
    playerId: input.playerId,
    previousAlignment: target.alignment,
    newAlignment: input.newAlignment,
    reason: input.reason,
  } satisfies EngineEvent

  const eventState = {
    ...nextState,
    events: [...nextState.events, event],
  }

  return processAftermath(eventState, [event]).state
}

export function swapPlayerRoles(
  state: EngineState,
  input: {
    firstPlayerId: string
    secondPlayerId: string
    reason?: string
  },
): EngineState {
  const first = getPlayer(state, input.firstPlayerId)
  const second = getPlayer(state, input.secondPlayerId)

  if (!first || !second || first.id === second.id) {
    return state
  }

  let nextState = cloneEngineState(state)
  nextState = updatePlayer(nextState, first.id, (player) => ({
    ...player,
    roleId: second.roleId,
  }))
  nextState = updatePlayer(nextState, second.id, (player) => ({
    ...player,
    roleId: first.roleId,
  }))

  const firstEvent = {
    type: 'player_role_changed',
    playerId: first.id,
    previousRoleId: first.roleId,
    newRoleId: second.roleId,
    reason: input.reason,
  } satisfies EngineEvent
  const secondEvent = {
    type: 'player_role_changed',
    playerId: second.id,
    previousRoleId: second.roleId,
    newRoleId: first.roleId,
    reason: input.reason,
  } satisfies EngineEvent

  const eventState = {
    ...nextState,
    events: [...nextState.events, firstEvent, secondEvent],
  }

  return processAftermath(eventState, [firstEvent, secondEvent]).state
}
