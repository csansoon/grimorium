import type { ScriptDefinition, ScriptWakeEntry } from '../scripts'
import { getRole } from '../roles'
import { getRuntimeWakeRoleIds } from '../scripts/wakeOrder'
import { getEngineRoleDefinition } from './roles/registry'
import { canUseAbility } from './roles/runtime'
import type { EngineState } from './state'

export type EngineNightQueuePhase = 'first_night' | 'other_night'

export type EngineNightQueueEntry = {
  playerId: string
  playerName: string
  roleId: string
  seatIndex: number
  wakeIndex: number
  note?: string
  hasPendingInformation: boolean
  hasPendingChoice: boolean
  availableActionKinds: string[]
}

function getScriptWakeEntriesForPhase(
  script: ScriptDefinition,
  phase: EngineNightQueuePhase,
): ScriptWakeEntry[] {
  const entries =
    phase === 'first_night' ? script.wakeOrder.firstNight : script.wakeOrder.otherNights

  return entries.filter(
    (entry) => !entry.hidden && (entry.mode ?? 'active') === 'active',
  )
}

function getPhaseKey(
  phase: EngineNightQueuePhase,
): 'firstNight' | 'otherNights' {
  return phase === 'first_night' ? 'firstNight' : 'otherNights'
}

function getPendingInformationForRole(
  state: EngineState,
  playerId: string,
  roleId: string,
): boolean {
  return state.pendingInformation.some(
    (packet) => packet.playerId === playerId && packet.sourceRoleId === roleId,
  )
}

function getPendingChoiceForRole(
  state: EngineState,
  playerId: string,
  roleId: string,
): boolean {
  return state.pendingStorytellerChoices.some(
    (choice) => choice.sourcePlayerId === playerId && choice.sourceRoleId === roleId,
  )
}

function getAvailableNightActionKinds(
  state: EngineState,
  playerId: string,
  roleId: string,
): string[] {
  const definition = getEngineRoleDefinition(roleId)
  if (!definition?.abilityUsage) {
    return []
  }

  return definition.abilityUsage
    .filter((policy) => canUseAbility(state, playerId, policy))
    .map((policy) => policy.actionKind)
}

function getFallbackWakeOrder(roleId: string, phase: EngineNightQueuePhase): number {
  const role = getRole(roleId)
  const key = getPhaseKey(phase)
  const canonical = role?.canonicalWakeOrder?.[key]
  if (canonical != null) {
    return canonical
  }

  return Number.MAX_SAFE_INTEGER
}

function shouldIncludeFromWakeSheet(
  state: EngineState,
  playerId: string,
  roleId: string,
): {
  include: boolean
  hasPendingInformation: boolean
  hasPendingChoice: boolean
  availableActionKinds: string[]
} {
  const hasPendingInformation = getPendingInformationForRole(state, playerId, roleId)
  const hasPendingChoice = getPendingChoiceForRole(state, playerId, roleId)
  const availableActionKinds = getAvailableNightActionKinds(state, playerId, roleId)

  if (hasPendingInformation || hasPendingChoice) {
    return {
      include: true,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  const player = state.players.find((candidate) => candidate.id === playerId)
  const definition = getEngineRoleDefinition(roleId)
  if (!player) {
    return {
      include: false,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  if (!definition) {
    return {
      include: Boolean(getRole(roleId)?.NightAction),
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  if (!definition.performAbility || availableActionKinds.length === 0) {
    return {
      include: false,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  return {
    include: definition.shouldQueueNightAction
      ? definition.shouldQueueNightAction({ state, player })
      : true,
    hasPendingInformation,
    hasPendingChoice,
    availableActionKinds,
  }
}

function shouldIncludeAsFallback(
  state: EngineState,
  playerId: string,
  roleId: string,
): {
  include: boolean
  hasPendingInformation: boolean
  hasPendingChoice: boolean
  availableActionKinds: string[]
} {
  const hasPendingInformation = getPendingInformationForRole(state, playerId, roleId)
  const hasPendingChoice = getPendingChoiceForRole(state, playerId, roleId)
  const availableActionKinds = getAvailableNightActionKinds(state, playerId, roleId)

  if (hasPendingInformation || hasPendingChoice) {
    return {
      include: true,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  const player = state.players.find((candidate) => candidate.id === playerId)
  const definition = getEngineRoleDefinition(roleId)
  if (!player) {
    return {
      include: false,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  if (!definition) {
    return {
      include: false,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  if (!definition.performAbility || availableActionKinds.length === 0) {
    return {
      include: false,
      hasPendingInformation,
      hasPendingChoice,
      availableActionKinds,
    }
  }

  return {
    include: definition.shouldQueueNightAction
      ? definition.shouldQueueNightAction({ state, player })
      : false,
    hasPendingInformation,
    hasPendingChoice,
    availableActionKinds,
  }
}

export function getEngineNightQueue(
  state: EngineState,
  script: ScriptDefinition,
): EngineNightQueueEntry[] {
  if (state.phase !== 'first_night' && state.phase !== 'other_night') {
    return []
  }

  const phase = state.phase
  const wakeEntries = getScriptWakeEntriesForPhase(script, phase)
  const wakeRoleIds = getRuntimeWakeRoleIds(wakeEntries)
  const seenKeys = new Set<string>()
  const result: EngineNightQueueEntry[] = []

  wakeEntries.forEach((entry, wakeIndex) => {
    state.players.forEach((player, seatIndex) => {
      if (player.roleId !== entry.roleId) {
        return
      }

      const evaluation = shouldIncludeFromWakeSheet(state, player.id, player.roleId)
      if (!evaluation.include) {
        return
      }

      const key = `${player.id}:${player.roleId}`
      seenKeys.add(key)
      result.push({
        playerId: player.id,
        playerName: player.name,
        roleId: player.roleId,
        seatIndex,
        wakeIndex,
        note: entry.note,
        hasPendingInformation: evaluation.hasPendingInformation,
        hasPendingChoice: evaluation.hasPendingChoice,
        availableActionKinds: evaluation.availableActionKinds,
      })
    })
  })

  const fallbackEntries = state.players
    .map((player, seatIndex) => ({ player, seatIndex }))
    .filter(({ player }) => {
      const key = `${player.id}:${player.roleId}`
      if (seenKeys.has(key)) {
        return false
      }

      return shouldIncludeAsFallback(state, player.id, player.roleId).include
    })
    .sort((left, right) => {
      const orderDiff =
        getFallbackWakeOrder(left.player.roleId, phase) -
        getFallbackWakeOrder(right.player.roleId, phase)
      if (orderDiff !== 0) {
        return orderDiff
      }

      return left.seatIndex - right.seatIndex
    })

  fallbackEntries.forEach(({ player, seatIndex }, index) => {
    const evaluation = shouldIncludeAsFallback(state, player.id, player.roleId)
    result.push({
      playerId: player.id,
      playerName: player.name,
      roleId: player.roleId,
      seatIndex,
      wakeIndex: wakeRoleIds.length + index,
      hasPendingInformation: evaluation.hasPendingInformation,
      hasPendingChoice: evaluation.hasPendingChoice,
      availableActionKinds: evaluation.availableActionKinds,
    })
  })

  return result
}

export function getNextEngineNightQueueEntry(
  state: EngineState,
  script: ScriptDefinition,
): EngineNightQueueEntry | null {
  return getEngineNightQueue(state, script)[0] ?? null
}
