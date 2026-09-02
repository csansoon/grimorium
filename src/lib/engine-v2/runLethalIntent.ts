import { commitResolvedLethal } from './commit'
import { processAftermath } from './aftermath'
import { resolveLethalIntent } from './resolution'
import type { EngineState } from './state'
import type { LethalIntent, ResolvedLethalIntent } from './types'

export type LethalRunResult = {
  state: EngineState
  resolved: ResolvedLethalIntent
}

export function runLethalIntent(
  state: EngineState,
  intent: LethalIntent,
): LethalRunResult {
  const resolved = resolveLethalIntent(state, intent)
  const committed = commitResolvedLethal(state, resolved)
  const aftermath = processAftermath(committed.state, committed.emittedEvents)

  return {
    state: {
      ...aftermath.state,
      lastResolutionTrace: {
        intent: resolved.intent,
        defenses: resolved.applicableDefenses,
        outcome: resolved.outcome,
        committedEvents: committed.emittedEvents,
        aftermathEvents: aftermath.emittedEvents,
      },
    },
    resolved,
  }
}
