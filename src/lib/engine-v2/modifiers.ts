import type { DefensiveModifier, LethalIntent, ResolveContext } from './types'
import type { EngineState } from './state'
import { getDynamicRoleModifiers } from './roles/runtime'

const PRIORITY_BY_KIND: Record<DefensiveModifier['kind'], number> = {
  conditional_immortality: 300,
  attack_protection: 200,
  execution_protection: 200,
  survival_charge: 100,
}

export function getApplicableDefenses(
  state: EngineState,
  intent: LethalIntent,
): DefensiveModifier[] {
  const ctx: ResolveContext = { state, intent }
  const allModifiers = [...state.activeModifiers, ...getDynamicRoleModifiers(state)]

  return allModifiers
    .filter((modifier) => modifier.enabled !== false)
    .filter((modifier) => !modifier.targetPlayerId || modifier.targetPlayerId === intent.targetPlayerId)
    .filter((modifier) => {
      if (modifier.appliesWhen) {
        return modifier.appliesWhen(ctx)
      }
      return true
    })
    .filter((modifier) => doesDefenseApplyToIntent(modifier, intent))
    .sort((left, right) => {
      const leftPriority = left.priority ?? PRIORITY_BY_KIND[left.kind]
      const rightPriority = right.priority ?? PRIORITY_BY_KIND[right.kind]
      return rightPriority - leftPriority
    })
}

export function isBypassed(
  modifier: DefensiveModifier,
  intent: LethalIntent,
): boolean {
  const bypasses = intent.bypasses ?? []

  if (bypasses.includes('all_defense')) {
    return true
  }

  if (
    bypasses.includes('all_protection') &&
    (modifier.kind === 'attack_protection' || modifier.kind === 'execution_protection')
  ) {
    return true
  }

  return (
    bypasses.includes(modifier.kind)
  )
}

function doesDefenseApplyToIntent(
  modifier: DefensiveModifier,
  intent: LethalIntent,
): boolean {
  if (modifier.kind === 'attack_protection') {
    return intent.kind === 'attack'
  }

  if (modifier.kind === 'execution_protection') {
    return intent.kind === 'execute'
  }

  return true
}
