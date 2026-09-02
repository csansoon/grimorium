import type { DefensiveModifier, LethalIntent, ResolvedDefense, ResolvedLethalIntent } from './types'
import { getApplicableDefenses, isBypassed } from './modifiers'
import { getPlayer, isPlayerTrulyAlive } from './state'
import type { EngineState } from './state'

export function resolveLethalIntent(
  state: EngineState,
  intent: LethalIntent,
): ResolvedLethalIntent {
  const target = getPlayer(state, intent.targetPlayerId)
  if (!target) {
    return {
      intent,
      applicableDefenses: [],
      outcome: {
        kind: 'no_effect',
        reason: 'Target player does not exist.',
      },
    }
  }

  if (!isPlayerTrulyAlive(target)) {
    return {
      intent,
      applicableDefenses: [],
      outcome: {
        kind: 'no_effect',
        reason: 'Target is already dead.',
      },
    }
  }

  if (intent.tags?.includes('public_death_only')) {
    return {
      intent,
      applicableDefenses: [],
      outcome: {
        kind: 'publicly_dead_but_alive',
        reason: intent.reason ?? 'The player appears dead, but remains mechanically alive.',
        byModifierIds: [],
      },
    }
  }

  const applicableDefenses = getApplicableDefenses(state, intent).map<ResolvedDefense>(
    (modifier) => ({
      modifier,
      bypassed: isBypassed(modifier, intent),
    }),
  )

  const activeDefenses = applicableDefenses
    .filter((entry) => !entry.bypassed)
    .map((entry) => entry.modifier)

  const immortality = activeDefenses.find(
    (modifier): modifier is Extract<DefensiveModifier, { kind: 'conditional_immortality' }> =>
      modifier.kind === 'conditional_immortality',
  )
  if (immortality) {
    return {
      intent,
      applicableDefenses,
      outcome: {
        kind: 'prevented',
        reason: immortality.reason ?? 'A conditional immortality rule prevented the death.',
        byModifierIds: [immortality.id],
      },
    }
  }

  const protection = activeDefenses.find((modifier) =>
    modifier.kind === 'attack_protection' || modifier.kind === 'execution_protection',
  )
  if (protection) {
    return {
      intent,
      applicableDefenses,
      outcome: {
        kind: 'prevented',
        reason: protection.reason ?? 'A protection effect prevented the death.',
        byModifierIds: [protection.id],
      },
    }
  }

  const survival = activeDefenses.find(
    (modifier): modifier is Extract<DefensiveModifier, { kind: 'survival_charge' }> =>
      modifier.kind === 'survival_charge' && modifier.charges > 0,
  )
  if (survival) {
    if (survival.survivalOutcome === 'publicly_dead_but_alive') {
      return {
        intent,
        applicableDefenses,
        outcome: {
          kind: 'publicly_dead_but_alive',
          reason:
            survival.reason ??
            'A survival effect makes the player appear dead but remain alive.',
          byModifierIds: [survival.id],
        },
      }
    }

    return {
      intent,
      applicableDefenses,
      outcome: {
        kind: 'survived',
        reason: survival.reason ?? 'A survival effect absorbed the death.',
        byModifierIds: [survival.id],
      },
    }
  }

  return {
    intent,
    applicableDefenses,
    outcome: {
      kind: 'dead',
      cause: intent.cause,
    },
  }
}
