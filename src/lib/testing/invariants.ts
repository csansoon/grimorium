import { getNextStep } from '../game'
import { canWakeAtNight } from '../roles/runtime-helpers'
import { getRole } from '../roles'
import { Game, getCurrentState, hasEffect } from '../types'

export type InvariantOptions = {
  checkQueuePrecedence?: boolean
}

type QueueDirective = 'skip' | 'immediate' | 'immediate_force'

type NightStepKey = {
  playerId: string
  roleId: string
  systemStepId?: string
}

function getNightActionKey(key: NightStepKey): string {
  return key.systemStepId
    ? `${key.playerId}:${key.roleId}:${key.systemStepId}`
    : `${key.playerId}:${key.roleId}`
}

function findLastEventIndex(game: Game, eventType: string): number {
  for (let i = game.history.length - 1; i >= 0; i--) {
    if (game.history[i].type === eventType) return i
  }
  return -1
}

function assertUniqueNightActionsPerKey(game: Game): void {
  const nightStartIndex = findLastEventIndex(game, 'night_started')
  if (nightStartIndex === -1) return

  const seen = new Set<string>()
  for (const entry of game.history.slice(nightStartIndex + 1)) {
    if (entry.type !== 'night_action' && entry.type !== 'night_skipped') continue

    const key = getNightActionKey({
      playerId: entry.data.playerId as string,
      roleId: entry.data.roleId as string,
      systemStepId: entry.data.systemStepId as string | undefined,
    })

    if (seen.has(key)) {
      throw new Error(`Night action key repeated in one night: ${key}`)
    }
    seen.add(key)
  }
}

function assertNoDanglingEffectSources(game: Game): void {
  const state = getCurrentState(game)
  const playerIds = new Set(state.players.map((player) => player.id))
  for (const player of state.players) {
    for (const effect of player.effects) {
      if (!effect.sourcePlayerId) continue
      if (!playerIds.has(effect.sourcePlayerId)) {
        throw new Error(
          `Dangling sourcePlayerId "${effect.sourcePlayerId}" on effect "${effect.type}"`,
        )
      }
    }
  }
}

function assertPlayersHaveValidCurrentRole(game: Game): void {
  const state = getCurrentState(game)
  for (const player of state.players) {
    const role = getRole(player.roleId)
    if (!role) {
      throw new Error(`Player ${player.id} has unknown roleId "${player.roleId}"`)
    }
  }
}

function assertWinnerConsistency(game: Game): void {
  const state = getCurrentState(game)
  if (state.phase === 'ended' && !state.winner) {
    throw new Error('Game is ended but winner is null')
  }
}

function assertDeadWakeGuard(game: Game): void {
  const state = getCurrentState(game)
  if (state.phase !== 'night') return
  const step = getNextStep(game)
  if (step.type !== 'night_action') return

  const player = state.players.find((candidate) => candidate.id === step.playerId)
  if (!player || !hasEffect(player, 'dead')) return

  const role = getRole(step.roleId)
  if (!role) return
  if (!canWakeAtNight(game, player, role)) {
    throw new Error(
      `Dead player ${player.id} scheduled for night action without wake allowance`,
    )
  }
}

function assertQueuePrecedence(game: Game): void {
  const state = getCurrentState(game)
  if (state.phase !== 'night') return
  const nightStartIndex = findLastEventIndex(game, 'night_started')
  if (nightStartIndex === -1) return

  const directives = new Map<string, QueueDirective>()
  const acted = new Set<string>()

  for (const entry of game.history.slice(nightStartIndex + 1)) {
    if (entry.type === 'night_queue_directive') {
      const playerId = entry.data.playerId as string | undefined
      const roleId = entry.data.roleId as string | undefined
      const directive = entry.data.directive as QueueDirective | undefined
      if (!playerId || !roleId || !directive) continue
      const key = getNightActionKey({
        playerId,
        roleId,
        systemStepId: entry.data.systemStepId as string | undefined,
      })
      directives.set(key, directive)
    }

    if (entry.type === 'night_action' || entry.type === 'night_skipped') {
      const key = getNightActionKey({
        playerId: entry.data.playerId as string,
        roleId: entry.data.roleId as string,
        systemStepId: entry.data.systemStepId as string | undefined,
      })
      acted.add(key)
    }
  }

  const pendingImmediate = Array.from(directives.entries())
    .filter(([key, directive]) => {
      if (acted.has(key)) return false
      return directive === 'immediate' || directive === 'immediate_force'
    })
    .map(([key]) => key)

  if (pendingImmediate.length === 0) return

  const step = getNextStep(game)
  if (step.type !== 'night_action' && step.type !== 'night_action_skip') return
  // Night 1 system steps (minion/demon/bluffs, etc.) are allowed to precede
  // queued player-role immediate directives.
  if (step.systemStepId) return

  const nextKey = getNightActionKey({
    playerId: step.playerId,
    roleId: step.roleId,
    systemStepId: step.systemStepId,
  })

  if (!pendingImmediate.includes(nextKey)) {
    throw new Error(
      `Expected pending immediate directive to be next, got ${nextKey}`,
    )
  }
}

export function assertEngineInvariants(
  game: Game,
  options: InvariantOptions = {},
): void {
  assertPlayersHaveValidCurrentRole(game)
  assertNoDanglingEffectSources(game)
  assertUniqueNightActionsPerKey(game)
  assertWinnerConsistency(game)
  assertDeadWakeGuard(game)
  if (options.checkQueuePrecedence !== false) {
    assertQueuePrecedence(game)
  }
}
