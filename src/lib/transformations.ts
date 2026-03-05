import { getCurrentAlignment, getCurrentRoleId } from './identity'
import { getRole } from './roles'
import { getEffect, resolveEffectPersistence } from './effects'
import type { EffectToAdd } from './roles/types'
import type { StateChanges } from './pipeline/types'
import type { Alignment, GameState } from './types'

export type TransformationRevealPolicy = 'none' | 'pending' | 'immediate'
export type TransformationQueuePolicy =
  | 'preserve'
  | 'skip_if_window_passed'
  | 'act_immediately'
  | 'act_immediately_force'

export type TransformationSource = {
  cause: string
  playerId?: string
  roleId?: string
}

export type TransformationTarget = {
  playerId: string
  newRoleId?: string
  newAlignment?: Alignment
  reveal?: TransformationRevealPolicy
  queuePolicy?: TransformationQueuePolicy
  addEffects?: EffectToAdd[]
  removeEffects?: string[]
  includeNewRoleInitialEffects?: boolean
}

export type TransformationPlan = {
  kind: 'role_change' | 'role_swap'
  source: TransformationSource
  targets: TransformationTarget[]
}

function pushEffect(
  record: Record<string, EffectToAdd[]>,
  playerId: string,
  effect: EffectToAdd,
) {
  record[playerId] = [...(record[playerId] ?? []), effect]
}

function pushRemoval(
  record: Record<string, string[]>,
  playerId: string,
  effectType: string,
) {
  if (record[playerId]?.includes(effectType)) return
  record[playerId] = [...(record[playerId] ?? []), effectType]
}

function collectAutomaticEffectRemovals(
  state: GameState,
  plan: TransformationPlan,
  removeEffects: Record<string, string[]>,
) {
  for (const target of plan.targets) {
    const player = state.players.find((candidate) => candidate.id === target.playerId)
    if (!player) continue

    const currentRoleId = getCurrentRoleId(player)
    const currentAlignment = getCurrentAlignment(player)
    const hasRoleChange =
      Boolean(target.newRoleId) && target.newRoleId !== currentRoleId
    const hasAlignmentChange =
      Boolean(target.newAlignment) && target.newAlignment !== currentAlignment

    if (!hasRoleChange && !hasAlignmentChange) continue

    for (const effect of player.effects) {
      const effectDef = getEffect(effect.type)
      const persistence = resolveEffectPersistence(effect, effectDef)

      if (
        (hasRoleChange && persistence.targetRoleChange === 'remove') ||
        (hasAlignmentChange && persistence.targetAlignmentChange === 'remove')
      ) {
        pushRemoval(removeEffects, player.id, effect.type)
      }
    }

    for (const affectedPlayer of state.players) {
      for (const effect of affectedPlayer.effects) {
        if (effect.sourcePlayerId !== player.id) continue

        const effectDef = getEffect(effect.type)
        const persistence = resolveEffectPersistence(effect, effectDef)

        if (
          (hasRoleChange && persistence.sourceRoleChange === 'remove') ||
          (hasAlignmentChange &&
            persistence.sourceAlignmentChange === 'remove')
        ) {
          pushRemoval(removeEffects, affectedPlayer.id, effect.type)
        }
      }
    }
  }
}

export function buildTransformationStateChanges(
  state: GameState,
  plan: TransformationPlan,
): StateChanges {
  const entries: StateChanges['entries'] = []
  const addEffects: Record<string, EffectToAdd[]> = {}
  const removeEffects: Record<string, string[]> = {}
  const changeRoles: Record<string, string> = {}
  const changeAlignments: Record<string, Alignment> = {}

  collectAutomaticEffectRemovals(state, plan, removeEffects)

  for (const target of plan.targets) {
    const player = state.players.find((candidate) => candidate.id === target.playerId)
    if (!player) continue

    const currentRoleId = getCurrentRoleId(player)
    const nextRoleId = target.newRoleId ?? currentRoleId
    const currentAlignment = getCurrentAlignment(player)
    const hasExplicitAlignment = target.newAlignment !== undefined
    const nextAlignment = target.newAlignment ?? currentAlignment

    if (target.newRoleId && target.newRoleId !== currentRoleId) {
      changeRoles[target.playerId] = target.newRoleId
      entries.push({
        type: 'role_changed',
        message: [],
        data: {
          playerId: target.playerId,
          fromRole: currentRoleId,
          toRole: target.newRoleId,
          fromAlignment: currentAlignment,
          toAlignment: nextAlignment,
          sourceCause: plan.source.cause,
          sourcePlayerId: plan.source.playerId,
          sourceRoleId: plan.source.roleId,
        },
      })
    }

    if (hasExplicitAlignment) {
      changeAlignments[target.playerId] = nextAlignment as Alignment
    }

    if (target.includeNewRoleInitialEffects && target.newRoleId) {
      const newRole = getRole(target.newRoleId)
      for (const effect of newRole?.initialEffects ?? []) {
        pushEffect(addEffects, target.playerId, { ...effect })
      }
    }

    for (const effect of target.addEffects ?? []) {
      pushEffect(addEffects, target.playerId, effect)
    }

    for (const effectType of target.removeEffects ?? []) {
      pushRemoval(removeEffects, target.playerId, effectType)
    }

    if (target.reveal === 'pending') {
      pushEffect(addEffects, target.playerId, {
        type: 'pending_role_reveal',
        expiresAt: 'never',
      })
    }

    if (target.reveal === 'immediate') {
      entries.push({
        type: 'role_change_revealed',
        message: [],
        data: {
          playerId: target.playerId,
          roleId: nextRoleId,
          alignment: nextAlignment,
          sourceCause: plan.source.cause,
          sourcePlayerId: plan.source.playerId,
          sourceRoleId: plan.source.roleId,
        },
      })
    }

    if (target.queuePolicy === 'skip_if_window_passed') {
      entries.push({
        type: 'night_queue_directive',
        message: [],
        data: {
          roleId: nextRoleId,
          playerId: target.playerId,
          directive: 'skip',
          sourceCause: plan.source.cause,
        },
      })
    }

    if (target.queuePolicy === 'act_immediately') {
      entries.push({
        type: 'night_queue_directive',
        message: [],
        data: {
          roleId: nextRoleId,
          playerId: target.playerId,
          directive: 'immediate',
          sourceCause: plan.source.cause,
        },
      })
    }

    if (target.queuePolicy === 'act_immediately_force') {
      entries.push({
        type: 'night_queue_directive',
        message: [],
        data: {
          roleId: nextRoleId,
          playerId: target.playerId,
          directive: 'immediate_force',
          sourceCause: plan.source.cause,
        },
      })
    }
  }

  return {
    entries,
    addEffects: Object.keys(addEffects).length > 0 ? addEffects : undefined,
    removeEffects:
      Object.keys(removeEffects).length > 0 ? removeEffects : undefined,
    changeRoles: Object.keys(changeRoles).length > 0 ? changeRoles : undefined,
    changeAlignments:
      Object.keys(changeAlignments).length > 0 ? changeAlignments : undefined,
  }
}
