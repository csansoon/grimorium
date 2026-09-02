import { processAftermath } from './aftermath'
import {
  cloneEngineState,
  createRevivedLifeState,
  getPlayer,
  updatePlayer,
  type EngineState,
} from './state'
import { releaseTriggerRegistrations } from './triggers'
import type { EngineEvent, TriggerEvent } from './types'

export type RevivePlayerOptions = {
  targetPlayerId: string
  sourcePlayerId?: string
  sourceRoleId?: string
  reason?: string
  clearStatusEffects?: boolean
  clearTargetModifiers?: boolean
}

export function revivePlayer(
  state: EngineState,
  options: RevivePlayerOptions,
): EngineState {
  const target = getPlayer(state, options.targetPlayerId)
  if (!target) {
    return state
  }

  if (target.life.projection.trueState === 'alive' && target.life.projection.publicState === 'alive') {
    return state
  }

  let nextState = cloneEngineState(state)

  nextState = updatePlayer(nextState, options.targetPlayerId, (player) => ({
    ...player,
    life: createRevivedLifeState(player.life.deathCount),
  }))

  if (options.clearStatusEffects) {
    nextState = {
      ...nextState,
      statusEffects: nextState.statusEffects.filter(
        (effect) => effect.targetPlayerId !== options.targetPlayerId,
      ),
      scheduledEffects: nextState.scheduledEffects.filter(
        (effect) => effect.effect.targetPlayerId !== options.targetPlayerId,
      ),
      activeTimedEffects: nextState.activeTimedEffects.filter(
        (effect) => effect.effect.targetPlayerId !== options.targetPlayerId,
      ),
    }
  }

  if (options.clearTargetModifiers) {
    nextState = {
      ...nextState,
      activeModifiers: nextState.activeModifiers.filter(
        (modifier) => modifier.targetPlayerId !== options.targetPlayerId,
      ),
    }
  }

  const reviveEvent = {
    type: 'player_revived',
    playerId: options.targetPlayerId,
    sourcePlayerId: options.sourcePlayerId,
    sourceRoleId: options.sourceRoleId,
    reason: options.reason,
  } satisfies EngineEvent

  nextState = {
    ...nextState,
    events: [...nextState.events, reviveEvent],
  }

  const triggerEvent: TriggerEvent = {
    type: 'player_revived',
    playerId: options.targetPlayerId,
    phase: nextState.phase,
  }

  const triggeredState = releaseTriggerRegistrations(nextState, triggerEvent)
  const aftermath = processAftermath(triggeredState, [reviveEvent])

  return {
    ...aftermath.state,
  }
}
