import type { DefensiveModifier, EngineEvent, ResolvedLethalIntent } from './types'
import {
  cloneEngineState,
  createDeadLifeState,
  updatePlayer,
  type EngineState,
} from './state'

export function commitResolvedLethal(
  state: EngineState,
  resolved: ResolvedLethalIntent,
): { state: EngineState; emittedEvents: EngineEvent[] } {
  let nextState = cloneEngineState(state)
  const emittedEvents: EngineEvent[] = [
    {
      type: 'intent_created',
      intent: resolved.intent,
    },
    {
      type: 'intent_resolved',
      intent: resolved.intent,
      outcome: resolved.outcome,
    },
  ]

  switch (resolved.outcome.kind) {
    case 'dead':
      nextState = updatePlayer(nextState, resolved.intent.targetPlayerId, (player) => ({
        ...player,
        life: createDeadLifeState(player.life.deathCount + 1),
      }))
      nextState = {
        ...nextState,
        pendingMadnessConsequences: nextState.pendingMadnessConsequences.filter(
          (entry) => entry.targetPlayerId !== resolved.intent.targetPlayerId,
        ),
      }
      emittedEvents.push({
        type: 'player_died',
        intent: resolved.intent,
        outcome: resolved.outcome,
      })
      break

    case 'prevented':
      emittedEvents.push({
        type: 'death_prevented',
        intent: resolved.intent,
        outcome: resolved.outcome,
      })
      break

    case 'survived':
      nextState = consumeSurvivalCharge(nextState, resolved)
      emittedEvents.push({
        type: 'death_survived',
        intent: resolved.intent,
        outcome: resolved.outcome,
      })
      break

    case 'publicly_dead_but_alive':
      nextState = updatePlayer(nextState, resolved.intent.targetPlayerId, (player) => ({
        ...player,
        life: createDeadLifeState(player.life.deathCount + 1, 'undead_hidden'),
      }))
      emittedEvents.push({
        type: 'public_death_recorded',
        intent: resolved.intent,
        outcome: resolved.outcome,
      })
      break

    case 'no_effect':
    case 'suppressed':
      break
  }

  nextState.events.push(...emittedEvents)

  return { state: nextState, emittedEvents }
}

function consumeSurvivalCharge(
  state: EngineState,
  resolved: ResolvedLethalIntent,
): EngineState {
  const consumed = new Set(
    resolved.outcome.kind === 'survived' || resolved.outcome.kind === 'publicly_dead_but_alive'
      ? resolved.outcome.byModifierIds
      : [],
  )
  const consumedSurvivalModifiers = resolved.applicableDefenses
    .filter((entry) => !entry.bypassed)
    .map((entry) => entry.modifier)
    .filter(
      (modifier): modifier is Extract<DefensiveModifier, { kind: 'survival_charge' }> =>
        modifier.kind === 'survival_charge' && consumed.has(modifier.id),
    )

  let nextState: EngineState = {
    ...state,
    activeModifiers: state.activeModifiers.flatMap((modifier) => {
      if (modifier.kind !== 'survival_charge' || !consumed.has(modifier.id)) {
        return [modifier]
      }

      const charges = Math.max(0, modifier.charges - 1)
      if (charges === 0 && modifier.consumeOnUse !== false) {
        return []
      }

      return [{ ...modifier, charges }] satisfies DefensiveModifier[]
    }),
  }

  for (const modifier of consumedSurvivalModifiers) {
    if (!modifier.consumedNoteKey || !modifier.targetPlayerId) {
      continue
    }

    const noteKey = modifier.consumedNoteKey
    nextState = updatePlayer(nextState, modifier.targetPlayerId, (player) => ({
      ...player,
      notes: {
        ...(player.notes ?? {}),
        [noteKey]: true,
      },
    }))
  }

  return nextState
}
