import { getPlayer, isPlayerTrulyAlive, type EngineState } from '../state'
import { getEffectiveAbilityOverrides, hasEffectiveStatusEffect } from '../derived'
import { resolveEngineIntent, resolveEngineIntents } from '../intents'
import type {
  AbilityAllowedWhile,
  AbilityOverride,
  AbilityUsagePolicy,
  DefensiveModifier,
  EngineEvent,
  EnginePlayer,
} from '../types'
import { getEngineRoleDefinition } from './registry'
import type { EngineRoleAction, EngineRoleResult } from './types'

export function getDynamicRoleModifiers(state: EngineState): DefensiveModifier[] {
  return state.players.flatMap((player) => {
    const definition = getEngineRoleDefinition(player.roleId)
    if (!definition?.getDynamicModifiers) return []
    return definition.getDynamicModifiers({ state, player })
  })
}

export function isRoleActive(state: EngineState, playerId: string): boolean {
  const player = getPlayer(state, playerId)
  if (!player) return false
  return isPlayerTrulyAlive(player) && !isPlayerMalfunctioning(state, player.id)
}

export function isRolePassiveActive(state: EngineState, playerId: string): boolean {
  const player = getPlayer(state, playerId)
  if (!player) {
    return false
  }

  const definition = getEngineRoleDefinition(player.roleId)
  if (!isPlayerTrulyAlive(player)) {
    return false
  }

  if (
    definition?.passiveMalfunctionPolicy === 'suppressed_passive' &&
    isPlayerMalfunctioning(state, player.id)
  ) {
    return false
  }

  return true
}

export function isPlayerMalfunctioning(state: EngineState, playerId: string): boolean {
  return (
    hasEffectiveStatusEffect(state, playerId, 'poisoned') ||
    hasEffectiveStatusEffect(state, playerId, 'drunk')
  )
}

function canResolveUnderMalfunction(
  policy: AbilityUsagePolicy | undefined,
): boolean {
  if (!policy) {
    return false
  }

  return policy.allowWhenMalfunctioning === true || !!policy.malfunctionPolicy
}

export function getAliveNeighbors(
  state: EngineState,
  playerId: string,
): [EnginePlayer | null, EnginePlayer | null] {
  const playerIndex = state.players.findIndex((player) => player.id === playerId)
  if (playerIndex === -1) return [null, null]

  let left: EnginePlayer | null = null
  for (let offset = 1; offset < state.players.length; offset += 1) {
    const index = (playerIndex - offset + state.players.length) % state.players.length
    const candidate = state.players[index]
    if (candidate.id !== playerId && isPlayerTrulyAlive(candidate)) {
      left = candidate
      break
    }
  }

  let right: EnginePlayer | null = null
  for (let offset = 1; offset < state.players.length; offset += 1) {
    const index = (playerIndex + offset) % state.players.length
    const candidate = state.players[index]
    if (candidate.id !== playerId && isPlayerTrulyAlive(candidate)) {
      right = candidate
      break
    }
  }

  return [left, right]
}

function isNightPhase(phase: EngineState['phase']): boolean {
  return phase === 'first_night' || phase === 'other_night'
}

function getAbilityUsageKey(playerId: string, abilityId: string): string {
  return `${playerId}:${abilityId}`
}

function getMatchingAbilityOverrides(
  state: EngineState,
  playerId: string,
  abilityId: string,
): AbilityOverride[] {
  return getEffectiveAbilityOverrides(state).filter(
    (override) =>
      override.playerId === playerId &&
      (!override.abilityId || override.abilityId === abilityId),
  )
}

export function applyEngineRoleResult(
  state: EngineState,
  result: EngineRoleResult,
): EngineState {
  if (
    result &&
    typeof result === 'object' &&
    'baseState' in result &&
    'intents' in result
  ) {
    return resolveEngineIntents(result.baseState, result.intents)
  }

  if (Array.isArray(result)) {
    return resolveEngineIntents(state, result)
  }

  if (result && typeof result === 'object' && 'kind' in result && 'id' in result) {
    return resolveEngineIntent(state, result)
  }

  return result
}

function resolveAllowedWhile(
  state: EngineState,
  playerId: string,
  policy: AbilityUsagePolicy,
): AbilityAllowedWhile {
  const base = policy.allowedWhile ?? 'alive_only'
  const overrides = getMatchingAbilityOverrides(state, playerId, policy.abilityId)
  if (base === 'alive_only' && overrides.some((override) => override.allowWhileDead)) {
    return 'alive_or_dead'
  }
  return base
}

export function canUseAbility(
  state: EngineState,
  playerId: string,
  policy: AbilityUsagePolicy,
): boolean {
  const player = getPlayer(state, playerId)
  if (!player) {
    return false
  }

  const overrides = getMatchingAbilityOverrides(state, playerId, policy.abilityId)
  if (overrides.some((override) => override.suppress)) {
    return false
  }

  if (isPlayerMalfunctioning(state, playerId) && !canResolveUnderMalfunction(policy)) {
    return false
  }

  const allowedWhile = resolveAllowedWhile(state, playerId, policy)
  const isAlive = isPlayerTrulyAlive(player)

  if (allowedWhile === 'alive_only' && !isAlive) {
    return false
  }

  if (allowedWhile === 'dead_only' && isAlive) {
    return false
  }

  if (policy.cadence === 'at_will') {
    return true
  }

  const usage = state.abilityUsage[getAbilityUsageKey(playerId, policy.abilityId)]
  if (!usage) {
    return true
  }

  if (policy.cadence === 'once_per_game') {
    return usage.useCount < 1
  }

  if (policy.cadence === 'once_per_night') {
    if (!isNightPhase(state.phase)) {
      return false
    }
    return usage.lastUsedNightSequence !== state.nightSequence
  }

  return usage.useCount < (policy.maxUses ?? 1)
}

export function recordAbilityUse(
  state: EngineState,
  playerId: string,
  policy: AbilityUsagePolicy,
): EngineState {
  const usageKey = getAbilityUsageKey(playerId, policy.abilityId)
  const previous = state.abilityUsage[usageKey]
  const nextUseCount = (previous?.useCount ?? 0) + 1
  const nextUsage = {
    useCount: nextUseCount,
    lastUsedNightSequence: isNightPhase(state.phase)
      ? state.nightSequence
      : previous?.lastUsedNightSequence,
  }

  return {
    ...state,
    abilityUsage: {
      ...state.abilityUsage,
      [usageKey]: nextUsage,
    },
    events: [
      ...state.events,
      {
        type: 'ability_use_recorded',
        playerId,
        abilityId: policy.abilityId,
        actionKind: policy.actionKind,
        useCount: nextUseCount,
        cadence: policy.cadence,
      } satisfies EngineEvent,
    ],
  }
}

export function applyRoleAbility(
  state: EngineState,
  playerId: string,
  action: EngineRoleAction,
): EngineState {
  const player = getPlayer(state, playerId)
  if (!player) return state

  const definition = getEngineRoleDefinition(player.roleId)
  if (!definition?.performAbility) return state

  const policy = definition.abilityUsage?.find(
    (candidate) => candidate.actionKind === action.kind,
  )
  if (policy && !canUseAbility(state, playerId, policy)) {
    return state
  }

  const stateForExecution =
    policy && policy.consumeWhen === 'on_attempt'
      ? recordAbilityUse(state, playerId, policy)
      : state
  const currentPlayer = getPlayer(stateForExecution, playerId)
  if (!currentPlayer) {
    return state
  }

  if (
    policy?.malfunctionPolicy === 'fail_closed' &&
    isPlayerMalfunctioning(stateForExecution, playerId)
  ) {
    return stateForExecution
  }

  const nextState = definition.performAbility(
    { state: stateForExecution, player: currentPlayer },
    action,
  )
  const resolvedState = applyEngineRoleResult(stateForExecution, nextState)

  if (policy && policy.consumeWhen === 'on_success' && resolvedState !== stateForExecution) {
    return recordAbilityUse(resolvedState, playerId, policy)
  }

  return resolvedState
}
