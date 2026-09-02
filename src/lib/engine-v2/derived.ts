import type { EngineState } from './state'
import type { AbilityOverride, TimedStatusEffect } from './types'
import { getEngineRoleDefinition } from './roles/registry'

export function getDynamicAbilityOverrides(state: EngineState): AbilityOverride[] {
  return state.players.flatMap((player) => {
    const definition = getEngineRoleDefinition(player.roleId)
    if (!definition?.getDynamicAbilityOverrides) return []
    return definition.getDynamicAbilityOverrides({ state, player })
  })
}

export function getEffectiveAbilityOverrides(state: EngineState): AbilityOverride[] {
  return [...state.abilityOverrides, ...getDynamicAbilityOverrides(state)]
}

export function getDynamicStatusEffects(state: EngineState): TimedStatusEffect[] {
  return state.players.flatMap((player) => {
    const definition = getEngineRoleDefinition(player.roleId)
    if (!definition?.getDynamicStatusEffects) return []
    return definition.getDynamicStatusEffects({ state, player })
  })
}

export function getEffectiveStatusEffects(state: EngineState): TimedStatusEffect[] {
  return [...state.statusEffects, ...getDynamicStatusEffects(state)]
}

export function hasEffectiveStatusEffect(
  state: EngineState,
  playerId: string,
  type: TimedStatusEffect['type'],
): boolean {
  return getEffectiveStatusEffects(state).some(
    (effect) => effect.targetPlayerId === playerId && effect.type === type,
  )
}

export function hasStaticStatusEffect(
  state: EngineState,
  playerId: string,
  type: TimedStatusEffect['type'],
): boolean {
  return state.statusEffects.some(
    (effect) => effect.targetPlayerId === playerId && effect.type === type,
  )
}
