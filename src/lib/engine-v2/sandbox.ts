import { createLethalIntent } from './intents'
import { runLethalIntent } from './runLethalIntent'
import { createAliveLifeState, createEngineState, type EngineState } from './state'

export function createDemoEngineState(): EngineState {
  return createEngineState([
    {
      id: 'demon',
      name: 'Demon',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'target',
      name: 'Target',
      roleId: 'monk',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ])
}

export function runDemoLethalResolution(): ReturnType<typeof runLethalIntent> {
  return runLethalIntent(
    createDemoEngineState(),
    createLethalIntent({
      kind: 'attack',
      sourcePlayerId: 'demon',
      targetPlayerId: 'target',
      cause: 'demon_attack',
      phase: 'other_night',
      reason: 'Demo lethal resolution',
    }),
  )
}
