import type { EngineEvent } from './types'
import type { EngineState } from './state'
import { processRoleEngineEvents } from './roleTriggers'

export function processAftermath(
  state: EngineState,
  emittedEvents: EngineEvent[],
): { state: EngineState; emittedEvents: EngineEvent[] } {
  let nextState = state

  for (const event of emittedEvents) {
    for (const handler of nextState.aftermathHandlers) {
      nextState = handler(nextState, event)
    }
  }

  return processRoleEngineEvents(nextState, emittedEvents)
}
