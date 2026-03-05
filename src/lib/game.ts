import {
  Game,
  GameState,
  HistoryEntry,
  PlayerState,
  RichMessage,
  Alignment,
  generateId,
  getCurrentState,
  hasEffect,
  getAlivePlayers,
} from './types'
import { getEffect, isMalfunctioning } from './effects'
import {
  getAlignmentForTeam,
  getCurrentRole,
  getCurrentRoleId,
  getCurrentTeam,
  initializePlayerIdentity,
} from './identity'
import { getRole } from './roles'
import { RoleDefinition, NightActionResult, EffectToAdd } from './roles/types'
import { getScriptForGame, type ScriptDefinition } from './scripts'
import { getRuntimeWakeRoleIds } from './scripts/wakeOrder'
import {
  resolveEvilInfoPlan,
  shouldShowDemonMinionStep,
  shouldShowMinionEvilTeamStep,
} from './evilInfo'
import { syncDerivedEffects } from './stateSync'
import {
  resolveIntent,
  applyPipelineChanges,
  checkDynamicWinConditions,
} from './pipeline'
import {
  canWakeAtNight,
  getFalseInfoMode,
  type FalseInfoMode,
} from './roles/runtime-helpers'
import { NominateIntent, ExecuteIntent } from './pipeline/types'
import type { WinConditionTrigger } from './pipeline/types'
import { trackEvent } from './analytics'

// ============================================================================
// GAME CREATION
// ============================================================================

export type PlayerSetup = {
  name: string
  roleId: string
}

export function createGame(
  name: string,
  scriptId: string,
  players: PlayerSetup[],
  scriptSnapshot?: ScriptDefinition,
): Game {
  const gameId = generateId()

  const playerStates: PlayerState[] = players.map((p) => {
    const role = getRole(p.roleId)
    const effects: PlayerState['effects'] = []

    // Apply initial effects defined by the role
    if (role?.initialEffects) {
      for (const effect of role.initialEffects) {
        effects.push({
          id: generateId(),
          type: effect.type,
          data: effect.data ?? {},
          expiresAt: effect.expiresAt ?? 'never',
        })
      }
    }

    return {
      id: generateId(),
      name: p.name,
      roleId: p.roleId,
      baseRoleId: p.roleId,
      baseAlignment: getAlignmentForTeam(role?.team),
      currentAlignment: getAlignmentForTeam(role?.team),
      effects,
    }
  })

  const initialState: GameState = syncDerivedEffects({
    phase: 'setup',
    round: 0,
    players: playerStates,
    winner: null,
  })

  const game: Game = {
    id: gameId,
    name,
    scriptId,
    scriptSnapshot,
    createdAt: Date.now(),
    storytellerNotes: '',
    history: [
      {
        id: generateId(),
        timestamp: Date.now(),
        type: 'game_created',
        message: [{ type: 'i18n', key: 'history.gameStarted' }],
        data: {
          players: playerStates.map((p) => ({
            id: p.id,
            name: p.name,
            roleId: p.roleId,
          })),
        },
        stateAfter: initialState,
      },
    ],
  }

  trackEvent('game_started', {
    player_count: players.length,
    script: scriptId,
  })

  return game
}

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

function expireEffects(
  state: GameState,
  expirationType: 'end_of_night' | 'end_of_day',
): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      effects: player.effects.filter((e) => e.expiresAt !== expirationType),
    })),
  }
}

export function addHistoryEntry(
  game: Game,
  entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'stateAfter'>,
  stateUpdates?: Partial<GameState>,
  addEffects?: Record<string, EffectToAdd[]>,
  removeEffects?: Record<string, string[]>,
  changeAlignments?: Record<string, Alignment>,
  changeRoles?: Record<string, string>,
): Game {
  const currentState = getCurrentState(game)

  // Apply state updates
  let newState = { ...currentState, ...stateUpdates }

  // Apply effect and role changes
  if (addEffects || removeEffects || changeRoles || changeAlignments) {
    newState = {
      ...newState,
      players: newState.players.map((player) => {
        let effects = [...player.effects]
        let roleId = player.roleId
        let currentAlignment = player.currentAlignment
        const hasRoleChange = Boolean(changeRoles?.[player.id])
        const hasAlignmentChange = Boolean(changeAlignments?.[player.id])

        // Remove effects
        if (removeEffects?.[player.id]) {
          effects = effects.filter(
            (e) => !removeEffects[player.id].includes(e.type),
          )
        }

        // Add effects
        if (addEffects?.[player.id]) {
          const newEffects = addEffects[player.id].map((e) => ({
            id: generateId(),
            type: e.type,
            data: e.data,
            sourcePlayerId: e.sourcePlayerId,
            expiresAt: e.expiresAt,
          }))
          effects = [...effects, ...newEffects]
        }

        // Change role
        if (changeRoles?.[player.id]) {
          roleId = changeRoles[player.id]
        }

        if (hasRoleChange && !hasAlignmentChange) {
          currentAlignment = getAlignmentForTeam(getRole(roleId)?.team)
        }

        if (changeAlignments?.[player.id]) {
          currentAlignment = changeAlignments[player.id]
        }

        const nextPlayer = {
          ...player,
          effects,
          roleId,
          baseRoleId: player.baseRoleId ?? player.roleId,
          baseAlignment:
            player.baseAlignment ??
            getAlignmentForTeam(
              getRole(player.baseRoleId ?? player.roleId)?.team,
            ),
          currentAlignment:
            currentAlignment ?? getAlignmentForTeam(getRole(roleId)?.team),
        }

        return initializePlayerIdentity(nextPlayer)
      }),
    }
  }

  newState = syncDerivedEffects({
    ...newState,
    players: newState.players.map(initializePlayerIdentity),
  })

  const historyEntry: HistoryEntry = {
    id: generateId(),
    timestamp: Date.now(),
    type: entry.type,
    message: entry.message,
    data: entry.data,
    stateAfter: newState,
  }

  return {
    ...game,
    history: [...game.history, historyEntry],
  }
}

// ============================================================================
// SETUP ACTIONS
// ============================================================================

import type { SetupActionResult } from './roles/types'

/**
 * Apply a setup action result to the game. Used for pre-revelation setup
 * (e.g., the Drunk choosing which Townsfolk role to believe they are).
 */
export function applySetupAction(
  game: Game,
  playerId: string,
  result: SetupActionResult,
): Game {
  const state = getCurrentState(game)
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return game

  const changeRoles = result.changeRole
    ? { [playerId]: result.changeRole }
    : undefined

  return addHistoryEntry(
    game,
    {
      type: 'setup_action',
      message: [
        {
          type: 'i18n',
          key: 'history.setupAction',
          params: {
            player: playerId,
            role: result.changeRole ?? player.roleId,
          },
        },
      ],
      data: {
        playerId,
        roleId: player.roleId,
        originalRole: player.roleId,
        newRole: result.changeRole,
      },
    },
    undefined,
    result.addEffects,
    result.removeEffects,
    undefined,
    changeRoles,
  )
}

// ============================================================================
// GAME FLOW
// ============================================================================

/**
 * Build a player-centric list of all players with night roles, sorted by the
 * active script's wake order. When multiple players share the same role, they
 * appear consecutively in seating order.
 *
 * Roles omitted from a script's wake sheet are appended at the end using their
 * legacy role-level order as a compatibility fallback.
 */
function getPlayersWithNightRoles(
  game: Game,
  state: GameState,
): { player: PlayerState; role: RoleDefinition }[] {
  const script = getScriptForGame(game)
  const wakeOrder =
    state.round <= 1
      ? getRuntimeWakeRoleIds(script?.wakeOrder.firstNight ?? [])
      : getRuntimeWakeRoleIds(script?.wakeOrder.otherNights ?? [])
  const wakeOrderIndex = new Map(
    wakeOrder.map((roleId, index) => [roleId, index]),
  )
  const ordered: Array<{
    player: PlayerState
    role: RoleDefinition
    wakeIndex: number
    seatIndex: number
  }> = []
  const fallback: Array<{
    player: PlayerState
    role: RoleDefinition
    seatIndex: number
  }> = []

  for (const [seatIndex, player] of state.players.entries()) {
    const role = getCurrentRole(player)
    if (!role || role.NightAction === null) continue

    const index = wakeOrderIndex.get(role.id)
    if (index !== undefined) {
      ordered.push({ player, role, wakeIndex: index, seatIndex })
    } else {
      fallback.push({ player, role, seatIndex })
    }
  }

  ordered.sort((a, b) => {
    if (a.wakeIndex !== b.wakeIndex) return a.wakeIndex - b.wakeIndex
    return a.seatIndex - b.seatIndex
  })

  fallback.sort((a, b) => {
    const aOrder = a.role.nightOrder ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.role.nightOrder ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.seatIndex - b.seatIndex
  })

  return [...ordered, ...fallback].map(({ player, role }) => ({ player, role }))
}

export type GameStep =
  | { type: 'role_reveal'; playerId: string }
  | {
      type: 'night_action'
      playerId: string
      roleId: string
      systemStepId?: NightSystemStepId
    }
  | {
      type: 'night_action_skip'
      playerId: string
      roleId: string
      systemStepId?: NightSystemStepId
    }
  | { type: 'night_waiting' }
  | { type: 'day' }
  | { type: 'game_over'; winner: 'townsfolk' | 'demon' }

export function getNextStep(game: Game): GameStep {
  const state = getCurrentState(game)

  // Check win conditions first
  const winResult = checkWinCondition(state, game)
  if (winResult) {
    return { type: 'game_over', winner: winResult }
  }

  if (state.phase === 'setup') {
    // Find next player who hasn't seen their role
    const revealedPlayers = game.history
      .filter((e) => e.type === 'role_revealed')
      .map((e) => e.data.playerId as string)

    const nextPlayer = state.players.find(
      (p) => !revealedPlayers.includes(p.id),
    )

    if (nextPlayer) {
      return { type: 'role_reveal', playerId: nextPlayer.id }
    }

    return { type: 'night_waiting' }
  }

  if (state.phase === 'night') {
    // Track processed player-role combinations so a player who changes role
    // mid-night can still act on a later wake in their new role.
    const nightStartIndex = findLastEventIndex(game, 'night_started')
    const actedNightActionKeys = new Set(
      game.history
        .slice(nightStartIndex + 1)
        .filter((e) => e.type === 'night_action' || e.type === 'night_skipped')
        .map((e) =>
          getNightActionKey(
            e.data.playerId as string,
            e.data.roleId as string,
            e.data.systemStepId as NightSystemStepId | undefined,
          ),
        ),
    )
    const queueDirectives = getResolvedNightQueueDirectives(game)

    for (const systemStep of getNightSystemSteps(game, state)) {
      const key = getNightActionKey(
        systemStep.playerId,
        systemStep.roleId,
        systemStep.systemStepId,
      )
      if (actedNightActionKeys.has(key)) continue

      if (!systemStep.shouldRun) {
        return {
          type: 'night_action_skip',
          playerId: systemStep.playerId,
          roleId: systemStep.roleId,
          systemStepId: systemStep.systemStepId,
        }
      }

      return {
        type: 'night_action',
        playerId: systemStep.playerId,
        roleId: systemStep.roleId,
        systemStepId: systemStep.systemStepId,
      }
    }

    // Build a player-centric list sorted by nightOrder
    const playersWithNightRoles = getPlayersWithNightRoles(game, state)
    const playersByNightKey = new Map(
      playersWithNightRoles.map(({ player, role }) => [
        getNightActionKey(player.id, role.id),
        { player, role },
      ]),
    )

    for (const key of queueDirectives.immediateKeys) {
      if (actedNightActionKeys.has(key) || queueDirectives.skipKeys.has(key)) {
        continue
      }
      const queued = playersByNightKey.get(key)
      if (!queued) continue

      const { player, role } = queued
      const forceImmediate = queueDirectives.forceImmediateKeys.has(key)
      if (!canWakeAtNight(game, player, role)) {
        return {
          type: 'night_action_skip',
          playerId: player.id,
          roleId: role.id,
        }
      }
      if (!forceImmediate && role.shouldWake && !role.shouldWake(game, player)) {
        return {
          type: 'night_action_skip',
          playerId: player.id,
          roleId: role.id,
        }
      }
      return {
        type: 'night_action',
        playerId: player.id,
        roleId: role.id,
      }
    }

    // Find next player that hasn't acted
    for (const { player, role } of playersWithNightRoles) {
      const key = getNightActionKey(player.id, role.id)
      if (queueDirectives.skipKeys.has(key)) continue

      if (!actedNightActionKeys.has(key)) {
        if (!canWakeAtNight(game, player, role)) {
          return {
            type: 'night_action_skip',
            playerId: player.id,
            roleId: role.id,
          }
        }
        if (role.shouldWake && !role.shouldWake(game, player)) {
          return {
            type: 'night_action_skip',
            playerId: player.id,
            roleId: role.id,
          }
        }
        return {
          type: 'night_action',
          playerId: player.id,
          roleId: role.id,
        }
      }
    }

    return { type: 'night_waiting' }
  }

  if (state.phase === 'day') {
    return { type: 'day' }
  }

  return { type: 'day' }
}

function findLastEventIndex(game: Game, eventType: string): number {
  for (let i = game.history.length - 1; i >= 0; i--) {
    if (game.history[i].type === eventType) {
      return i
    }
  }
  return -1
}

function getNightActionKey(
  playerId: string,
  roleId: string,
  systemStepId?: NightSystemStepId,
): string {
  return systemStepId
    ? `${playerId}:${roleId}:${systemStepId}`
    : `${playerId}:${roleId}`
}

export type NightSystemStepId =
  | 'minion_info'
  | 'demon_info'
  | 'demon_bluffs'
  | 'demon_creation_deaths'

type NightSystemStep = {
  systemStepId: NightSystemStepId
  roleId: string
  playerId: string
  playerName: string
  dashboardKind: NightRoleStatus['dashboardKind']
  shouldRun: boolean
  skippedReasonCode?: NightRoleStatus['skippedReasonCode']
}

function findPitHagDemonCreationContext(
  game: Game,
  state: GameState,
): {
  playerId: string
  playerName: string
  roleId: string
} | null {
  const nightStartIndex = findLastEventIndex(game, 'night_started')
  if (nightStartIndex === -1) return null

  for (const entry of game.history.slice(nightStartIndex + 1)) {
    if (entry.type !== 'role_changed') continue
    if (entry.data.sourceCause !== 'pit_hag_change') continue

    const fromRoleId = entry.data.fromRole as string | undefined
    const toRoleId = entry.data.toRole as string | undefined
    if (!fromRoleId || !toRoleId) continue

    const fromTeam = getRole(fromRoleId)?.team
    const toTeam = getRole(toRoleId)?.team
    if (toTeam !== 'demon' || fromTeam === 'demon') continue

    const sourcePlayerId =
      (entry.data.sourcePlayerId as string | undefined) ??
      (entry.data.playerId as string | undefined)
    if (!sourcePlayerId) continue

    const sourcePlayer = state.players.find(
      (candidate) => candidate.id === sourcePlayerId,
    )
    if (!sourcePlayer) continue

    const sourceRoleId = entry.data.sourceRoleId as string | undefined

    return {
      playerId: sourcePlayer.id,
      playerName: sourcePlayer.name,
      roleId: sourceRoleId ?? getCurrentRoleId(sourcePlayer),
    }
  }

  return null
}

function getNightSystemSteps(game: Game, state: GameState): NightSystemStep[] {
  if (state.phase !== 'night') return []
  const steps: NightSystemStep[] = []

  if (state.round === 1) {
    const evilInfoPlan = resolveEvilInfoPlan(state)
    const skippedReasonCode = evilInfoPlan.reasonTags.includes(
      'global:under_seven_players',
    )
      ? 'evil_info_under_seven'
      : undefined

    for (const player of state.players) {
      if (getCurrentTeam(player) !== 'minion') continue
      steps.push({
        systemStepId: 'minion_info',
        roleId: getCurrentRoleId(player),
        playerId: player.id,
        playerName: player.name,
        dashboardKind: 'minion_info',
        shouldRun: shouldShowMinionEvilTeamStep(state, evilInfoPlan),
        skippedReasonCode,
      })
    }

    for (const player of state.players) {
      if (getCurrentTeam(player) !== 'demon') {
        continue
      }
      steps.push({
        systemStepId: 'demon_info',
        roleId: getCurrentRoleId(player),
        playerId: player.id,
        playerName: player.name,
        dashboardKind: 'demon_info',
        shouldRun: shouldShowDemonMinionStep(state, evilInfoPlan),
        skippedReasonCode,
      })
      steps.push({
        systemStepId: 'demon_bluffs',
        roleId: getCurrentRoleId(player),
        playerId: player.id,
        playerName: player.name,
        dashboardKind: 'demon_bluffs',
        shouldRun: evilInfoPlan.demonLearnsBluffs,
      })
    }
  }

  const demonCreationContext = findPitHagDemonCreationContext(game, state)
  if (demonCreationContext) {
    steps.push({
      systemStepId: 'demon_creation_deaths',
      roleId: demonCreationContext.roleId,
      playerId: demonCreationContext.playerId,
      playerName: demonCreationContext.playerName,
      dashboardKind: 'demon_creation_deaths',
      shouldRun: true,
    })
  }

  return steps
}

type NightQueueDirective = 'skip' | 'immediate' | 'immediate_force'

type ResolvedNightQueueDirectives = {
  skipKeys: Set<string>
  immediateKeys: string[]
  forceImmediateKeys: Set<string>
}

function getResolvedNightQueueDirectives(
  game: Game,
): ResolvedNightQueueDirectives {
  const nightStartIndex = findLastEventIndex(game, 'night_started')
  if (nightStartIndex === -1) {
    return {
      skipKeys: new Set(),
      immediateKeys: [],
      forceImmediateKeys: new Set(),
    }
  }

  const actedKeys = new Set(
    game.history
      .slice(nightStartIndex + 1)
      .filter(
        (entry) =>
          entry.type === 'night_action' || entry.type === 'night_skipped',
      )
      .map((entry) =>
        getNightActionKey(
          entry.data.playerId as string,
          entry.data.roleId as string,
          entry.data.systemStepId as NightSystemStepId | undefined,
        ),
      ),
  )

  const directives = new Map<string, NightQueueDirective>()
  const immediateOrder: string[] = []
  const forceImmediateKeys = new Set<string>()

  for (const entry of game.history.slice(nightStartIndex + 1)) {
    if (entry.type !== 'night_queue_directive') continue

    const playerId = entry.data.playerId as string | undefined
    const roleId = entry.data.roleId as string | undefined
    const directive = entry.data.directive as NightQueueDirective | undefined
    if (!playerId || !roleId || !directive) continue

    const key = getNightActionKey(
      playerId,
      roleId,
      entry.data.systemStepId as NightSystemStepId | undefined,
    )
    directives.set(key, directive)

    if (directive === 'immediate') {
      const previousIndex = immediateOrder.indexOf(key)
      if (previousIndex !== -1) immediateOrder.splice(previousIndex, 1)
      immediateOrder.push(key)
    } else if (directive === 'immediate_force') {
      const previousIndex = immediateOrder.indexOf(key)
      if (previousIndex !== -1) immediateOrder.splice(previousIndex, 1)
      immediateOrder.push(key)
      forceImmediateKeys.add(key)
    }
  }

  const skipKeys = new Set<string>()
  const immediateKeys = immediateOrder.filter((key) => {
    if (actedKeys.has(key)) return false
    return (
      directives.get(key) === 'immediate' ||
      directives.get(key) === 'immediate_force'
    )
  })

  for (const [key, directive] of directives.entries()) {
    if (actedKeys.has(key)) continue
    if (directive === 'skip') {
      skipKeys.add(key)
    }
  }

  return { skipKeys, immediateKeys, forceImmediateKeys }
}

// ============================================================================
// PHASE TRANSITIONS
// ============================================================================

export function startNight(game: Game): Game {
  const state = getCurrentState(game)
  const newRound = state.phase === 'setup' ? 1 : state.round + 1

  // Expire effects that should end at end of day (e.g., Poisoner's poison)
  const stateAfterExpiration = expireEffects(state, 'end_of_day')

  return addHistoryEntry(
    game,
    {
      type: 'night_started',
      message: [
        {
          type: 'i18n',
          key: 'history.nightBegins',
          params: { round: newRound },
        },
      ],
      data: { round: newRound },
    },
    {
      phase: 'night',
      round: newRound,
      players: stateAfterExpiration.players,
    },
  )
}

export function startDay(game: Game): Game {
  // Resolve night - add death announcement entries
  let updatedGame = addHistoryEntry(game, {
    type: 'night_resolved',
    message: [{ type: 'i18n', key: 'history.sunRises' }],
    data: {},
  })

  // Find who died tonight by comparing the alive players at the start of the
  // night to the current resolved night state. This catches any night death,
  // regardless of the specific action label that caused it.
  const nightStartIndex = findLastEventIndex(updatedGame, 'night_started')
  const nightStartState =
    nightStartIndex >= 0
      ? updatedGame.history[nightStartIndex].stateAfter
      : null
  const aliveAtNightStart = new Set(
    (nightStartState?.players ?? [])
      .filter((player) => !hasEffect(player, 'dead'))
      .map((player) => player.id),
  )

  // Announce deaths
  const currentState = getCurrentState(updatedGame)
  for (const playerId of aliveAtNightStart) {
    const player = currentState.players.find((p) => p.id === playerId)
    if (player && hasEffect(player, 'dead')) {
      updatedGame = addHistoryEntry(updatedGame, {
        type: 'effect_added',
        message: [
          {
            type: 'i18n',
            key: 'history.diedInNight',
            params: { player: player.id },
          },
        ],
        data: { playerId: player.id, effectType: 'dead' },
      })
    }
  }

  // Expire effects that should end at end of night (e.g., Monk's protection)
  const stateAfterExpiration = expireEffects(
    getCurrentState(updatedGame),
    'end_of_night',
  )

  // Transition to day with expired effects applied
  return addHistoryEntry(
    updatedGame,
    {
      type: 'day_started',
      message: [
        {
          type: 'i18n',
          key: 'history.dayBegins',
          params: { round: currentState.round },
        },
      ],
      data: { round: currentState.round },
    },
    { phase: 'day', players: stateAfterExpiration.players },
  )
}

export function markRoleRevealed(game: Game, playerId: string): Game {
  const state = getCurrentState(game)
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return game
  const roleId = getCurrentRoleId(player)

  return addHistoryEntry(game, {
    type: 'role_revealed',
    message: [
      {
        type: 'i18n',
        key: 'history.learnedRole',
        params: { player: playerId, role: roleId },
      },
    ],
    data: { playerId, roleId },
  })
}

export function recordPreparedNightAction(
  game: Game,
  playerId: string,
  roleId: string,
  preparedData: Record<string, unknown>,
): Game {
  return addHistoryEntry(game, {
    type: 'setup_action',
    message: [
      {
        type: 'i18n',
        key: 'history.setupAction',
        params: { player: playerId, role: roleId },
      },
    ],
    data: {
      playerId,
      roleId,
      preparedNightAction: preparedData,
    },
  })
}

export function getPreparedNightActionData<T extends Record<string, unknown>>(
  game: Game,
  playerId: string,
  roleId: string,
): T | null {
  for (let i = game.history.length - 1; i >= 0; i--) {
    const entry = game.history[i]
    if (entry.type !== 'setup_action') continue
    if (entry.data.playerId !== playerId) continue
    if (entry.data.roleId !== roleId) continue

    const preparedData = entry.data.preparedNightAction
    if (preparedData && typeof preparedData === 'object') {
      return preparedData as T
    }
  }

  return null
}

// markRoleChangeRevealed is no longer needed here — role change reveals
// are now handled as night follow-ups via the pending_role_reveal effect.
// The follow-up's ActionComponent creates the role_change_revealed entry.

export function applyNightAction(game: Game, result: NightActionResult): Game {
  let updatedGame = game

  // Apply direct entries and effects (not the intent — that's handled by the pipeline)
  const directEntries = result.entries
  const directResult = {
    entries: directEntries,
    stateUpdates: result.stateUpdates,
    addEffects: result.addEffects,
    removeEffects: result.removeEffects,
    changeAlignments: result.changeAlignments,
    changeRoles: result.changeRoles,
  }

  for (const entry of directResult.entries) {
    updatedGame = addHistoryEntry(
      updatedGame,
      entry,
      directResult.stateUpdates,
      directResult.addEffects,
      directResult.removeEffects,
      directResult.changeAlignments,
      directResult.changeRoles,
    )
    // Only apply state/effects/roles on first entry
    directResult.stateUpdates = undefined
    directResult.addEffects = undefined
    directResult.removeEffects = undefined
    directResult.changeAlignments = undefined
    directResult.changeRoles = undefined
  }

  return updatedGame
}

export function skipNightAction(
  game: Game,
  roleId: string,
  playerId: string,
  systemStepId?: NightSystemStepId,
): Game {
  return addHistoryEntry(game, {
    type: 'night_skipped',
    message: [
      {
        type: 'i18n',
        key: 'history.noActionTonight',
        params: { role: roleId },
      },
    ],
    data: { roleId, playerId, systemStepId },
  })
}

// ============================================================================
// NOMINATIONS — Resolved through the pipeline
// ============================================================================

/**
 * Nominate a player for execution.
 * The nomination goes through the pipeline, which handles effect interactions
 * like the Virgin's Pure effect.
 */
export function nominate(
  game: Game,
  nominatorId: string,
  nomineeId: string,
): Game {
  const state = getCurrentState(game)
  const nominator = state.players.find((p) => p.id === nominatorId)
  const nominee = state.players.find((p) => p.id === nomineeId)

  if (!nominator || !nominee) return game

  const intent: NominateIntent = {
    type: 'nominate',
    nominatorId,
    nomineeId,
  }

  const result = resolveIntent(intent, state, game)

  // Nominations never require UI input, so result is always resolved or prevented
  if (result.type === 'needs_input') {
    // This shouldn't happen, but handle gracefully
    return game
  }

  return applyPipelineChanges(game, result.stateChanges)
}

// ============================================================================
// VOTING — Official BotC rules: binary voting, threshold, deferred execution
// ============================================================================

/**
 * The status of "the block" — the player currently nominated for execution.
 * In the official rules, the player with the most votes (above threshold)
 * is "on the block" and will be executed at end of day.
 */
export type BlockStatus = {
  playerId: string
  playerName: string
  voteCount: number
} | null

/**
 * Get who is currently "on the block" — the player with the highest
 * vote count that met the threshold today. Returns null if nobody qualified.
 * Scans vote entries since the last day_started.
 */
export function getBlockStatus(game: Game): BlockStatus {
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  if (dayStartIndex === -1) return null

  let block: BlockStatus = null

  for (let i = dayStartIndex + 1; i < game.history.length; i++) {
    const entry = game.history[i]
    if (entry.type === 'vote' && entry.data.replacesBlock === true) {
      block = {
        playerId: entry.data.nomineeId as string,
        playerName: entry.data.nomineeName as string,
        voteCount: entry.data.voteCount as number,
      }
    }
  }

  return block
}

/**
 * Get the set of player IDs who have been nominated today.
 */
export function getNomineesToday(game: Game): Set<string> {
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  if (dayStartIndex === -1) return new Set()
  const ids = new Set<string>()
  for (let i = dayStartIndex + 1; i < game.history.length; i++) {
    if (game.history[i].type === 'nomination') {
      ids.add(game.history[i].data.nomineeId as string)
    }
    if (game.history[i].type === 'nomination_canceled') {
      ids.delete(game.history[i].data.nomineeId as string)
    }
  }
  return ids
}

/**
 * Check if a virgin execution happened today (nominations should be blocked).
 */
export function hasVirginExecutionToday(game: Game): boolean {
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  if (dayStartIndex === -1) return false
  for (let i = dayStartIndex + 1; i < game.history.length; i++) {
    if (game.history[i].type === 'virgin_execution') {
      return true
    }
  }
  return false
}

/**
 * Get the vote threshold: the minimum number of votes needed to go on the block.
 * This is at least half the alive players (rounded up).
 */
export function getVoteThreshold(state: GameState): number {
  return Math.ceil(getAlivePlayers(state).length / 2)
}

/**
 * Resolve a vote on a nominated player.
 *
 * Official BotC rules:
 * - Voting is binary: you vote (raise hand) or don't
 * - Threshold: votes >= ceil(aliveCount / 2) to meet the minimum
 * - If the vote meets threshold AND is strictly higher than the current block,
 *   the nominee replaces whoever was on the block
 * - If it ties with the current block, nobody is on the block (tie = no execution)
 * - Execution is deferred to end of day via executeAtEndOfDay()
 */
export function resolveVote(
  game: Game,
  nomineeId: string,
  voteCount: number,
  votedIds?: string[],
): Game {
  const state = getCurrentState(game)
  const nominee = state.players.find((p) => p.id === nomineeId)
  if (!nominee) return game

  const threshold = getVoteThreshold(state)
  const meetsThreshold = voteCount >= threshold
  const currentBlock = getBlockStatus(game)

  // Determine if this vote replaces the current block
  let replacesBlock = false
  let clearsBlock = false

  if (meetsThreshold) {
    if (!currentBlock) {
      // No one on the block — this player takes it
      replacesBlock = true
    } else if (voteCount > currentBlock.voteCount) {
      // Strictly more votes — replaces the block
      replacesBlock = true
    } else if (voteCount === currentBlock.voteCount) {
      // Tie — clears the block (nobody executed)
      clearsBlock = true
    }
    // If fewer votes than current block, nothing changes
  }

  // Mark dead voters as having used their vote (only when detailed IDs available)
  const addEffects: Record<string, { type: string }[]> = {}
  if (votedIds) {
    for (const voterId of votedIds) {
      const voter = state.players.find((p) => p.id === voterId)
      if (
        voter &&
        hasEffect(voter, 'dead') &&
        !hasEffect(voter, 'used_dead_vote')
      ) {
        addEffects[voterId] = [{ type: 'used_dead_vote' }]
      }
    }
  }

  // Build history message
  const messageKey = replacesBlock ? 'history.votePassed' : 'history.voteFailed'

  const updatedGame = addHistoryEntry(
    game,
    {
      type: 'vote',
      message: [
        {
          type: 'i18n',
          key: 'history.voteResult',
          params: {
            player: nomineeId,
            votes: voteCount,
            threshold,
          },
        },
        {
          type: 'i18n',
          key: messageKey,
          params: { player: nomineeId },
        },
      ],
      data: {
        nomineeId,
        nomineeName: nominee.name,
        votedIds: votedIds ?? [],
        voteCount,
        threshold,
        meetsThreshold,
        replacesBlock,
        clearsBlock,
      },
    },
    { phase: 'day' },
    addEffects,
  )

  // If there's a tie, record a separate entry clearing the block
  if (clearsBlock) {
    return addHistoryEntry(updatedGame, {
      type: 'vote',
      message: [
        {
          type: 'i18n',
          key: 'history.voteTied',
          params: { player: nomineeId },
        },
      ],
      data: {
        nomineeId,
        nomineeName: nominee.name,
        voteCount,
        threshold,
        meetsThreshold: true,
        replacesBlock: false,
        clearsBlock: true,
        // A tie clear means we need to reset the block.
        // We track this by marking no entry as replacesBlock after this point.
      },
    })
  }

  return updatedGame
}

export function cancelNomination(
  game: Game,
  nominatorId: string,
  nomineeId: string,
): Game {
  const state = getCurrentState(game)
  const nominator = state.players.find((p) => p.id === nominatorId)
  const nominee = state.players.find((p) => p.id === nomineeId)
  if (!nominator || !nominee) return game

  return addHistoryEntry(game, {
    type: 'nomination_canceled',
    message: [
      {
        type: 'text',
        content: `${nominator.name}'s nomination of ${nominee.name} was canceled`,
      },
    ],
    data: {
      nominatorId,
      nomineeId,
    },
  })
}

/**
 * Execute whoever is on the block at end of day.
 * Called when the narrator ends the day. Routes through the intent pipeline
 * so effects (Scarlet Woman, Saint, etc.) can intercept.
 * Returns the game unchanged if nobody is on the block.
 */
export function executeAtEndOfDay(game: Game): Game {
  const block = getBlockStatus(game)
  if (!block) return game

  // Check for a tie-clear that happened after the block was set
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  for (let i = game.history.length - 1; i > dayStartIndex; i--) {
    const entry = game.history[i]
    if (entry.type === 'vote' && entry.data.clearsBlock === true) {
      // The most recent clear is after the most recent block replacement
      // Check if any replacesBlock entry comes after this clear
      let hasBlockAfterClear = false
      for (let j = i + 1; j < game.history.length; j++) {
        if (
          game.history[j].type === 'vote' &&
          game.history[j].data.replacesBlock === true
        ) {
          hasBlockAfterClear = true
          break
        }
      }
      if (!hasBlockAfterClear) {
        return game // Block was cleared by a tie, no execution
      }
    }
  }

  const executeIntent: ExecuteIntent = {
    type: 'execute',
    playerId: block.playerId,
    cause: 'execution',
  }

  const result = resolveIntent(executeIntent, getCurrentState(game), game)

  // Executions don't require UI input, so result is always resolved or prevented
  if (result.type === 'needs_input') {
    return game
  }

  return applyPipelineChanges(game, result.stateChanges)
}

// ============================================================================
// WIN CONDITIONS — Dynamic, effect/role-driven
// ============================================================================

/**
 * Core win condition check: demons dead or 2 alive.
 * Plus dynamic win conditions from effects and roles.
 */
export function checkWinCondition(
  state: GameState,
  game?: Game,
): 'townsfolk' | 'demon' | null {
  const alivePlayers = getAlivePlayers(state)
  const aliveDemons = alivePlayers.filter((p) => getCurrentTeam(p) === 'demon')

  // Good wins if all demons are dead
  if (aliveDemons.length === 0) {
    return 'townsfolk'
  }

  // Evil wins if only 2 players remain (and one is a demon)
  if (alivePlayers.length <= 2 && aliveDemons.length > 0) {
    return 'demon'
  }

  // Check dynamic win conditions from effects and roles
  if (game) {
    const dynamicResult = checkDynamicWinConditions(state, game, [
      'after_execution',
      'after_state_change',
    ])
    if (dynamicResult) return dynamicResult
  }

  return null
}

/**
 * Check end-of-day specific win conditions (e.g., Mayor's peaceful victory).
 * Called when the narrator ends the day.
 */
export function checkEndOfDayWinConditions(
  state: GameState,
  game: Game,
): 'townsfolk' | 'demon' | null {
  return checkDynamicWinConditions(state, game, ['end_of_day'])
}

export type WinReasonCode =
  | 'all_demons_dead'
  | 'final_two_alive'
  | 'vortox_no_execution'
  | 'martyrdom_execution'
  | 'evil_twin_good_executed'
  | 'evil_twin_evil_executed'
  | 'mayor_peaceful_victory'
  | 'special_ability'

type WinReasonDetails = {
  code: WinReasonCode
  sourceRoleId?: string
  sourceEffectType?: string
}

function hadExecutionSinceLastDayStart(game: Game): boolean {
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  if (dayStartIndex === -1) return false

  for (let i = dayStartIndex + 1; i < game.history.length; i++) {
    const type = game.history[i].type
    if (type === 'execution' || type === 'virgin_execution') {
      return true
    }
  }

  return false
}

function inferSpecialAbilitySource(
  state: GameState,
  game: Game,
  winner: 'townsfolk' | 'demon',
): Pick<WinReasonDetails, 'sourceRoleId' | 'sourceEffectType'> {
  const triggers: WinConditionTrigger[] = [
    'after_execution',
    'after_state_change',
    'end_of_day',
  ]

  for (const player of state.players) {
    if (isMalfunctioning(player)) continue

    for (const effect of player.effects) {
      const effectDef = getEffect(effect.type)
      if (!effectDef?.winConditions) continue

      for (const winCondition of effectDef.winConditions) {
        if (!triggers.includes(winCondition.trigger)) continue
        if (winCondition.check(state, game) === winner) {
          return { sourceEffectType: effect.type }
        }
      }
    }
  }

  for (const player of state.players) {
    if (isMalfunctioning(player)) continue

    const role = getCurrentRole(player)
    if (!role?.winConditions) continue

    for (const winCondition of role.winConditions) {
      if (!triggers.includes(winCondition.trigger)) continue
      if (winCondition.check(state, game) === winner) {
        return { sourceRoleId: role.id }
      }
    }
  }

  return {}
}

function inferWinReason(
  state: GameState,
  game: Game,
  winner: 'townsfolk' | 'demon',
): WinReasonDetails {
  const alivePlayers = getAlivePlayers(state)
  const aliveDemons = alivePlayers.filter((player) => getCurrentTeam(player) === 'demon')

  if (winner === 'townsfolk' && aliveDemons.length === 0) {
    return { code: 'all_demons_dead' }
  }

  if (winner === 'demon' && alivePlayers.length <= 2 && aliveDemons.length > 0) {
    return { code: 'final_two_alive' }
  }

  const hasExecutionToday = hadExecutionSinceLastDayStart(game)
  const hasVortoxRule = state.players.some((player) =>
    player.effects.some((effect) => effect.type === 'vortox_rule'),
  )
  if (winner === 'demon' && hasVortoxRule && !hasExecutionToday) {
    return { code: 'vortox_no_execution' }
  }

  const lastEntry = game.history.at(-1)
  if (
    lastEntry &&
    (lastEntry.type === 'execution' || lastEntry.type === 'virgin_execution')
  ) {
    const executedId = (lastEntry.data.playerId ??
      lastEntry.data.nominatorId) as string | undefined
    const executedPlayer = executedId
      ? state.players.find((player) => player.id === executedId)
      : null

    if (executedPlayer?.effects.some((effect) => effect.type === 'martyrdom')) {
      return { code: 'martyrdom_execution' }
    }

    const twinLink = executedPlayer?.effects.find(
      (effect) => effect.type === 'evil_twin_link',
    )
    if (twinLink) {
      return {
        code:
          twinLink.data?.isEvilTwin === true
            ? 'evil_twin_evil_executed'
            : 'evil_twin_good_executed',
      }
    }
  }

  const hasAliveMayor = alivePlayers.some(
    (player) => player.roleId === 'mayor' && !isMalfunctioning(player),
  )
  if (winner === 'townsfolk' && alivePlayers.length === 3 && hasAliveMayor && !hasExecutionToday) {
    return { code: 'mayor_peaceful_victory' }
  }

  return {
    code: 'special_ability',
    ...inferSpecialAbilitySource(state, game, winner),
  }
}

export function endGame(game: Game, winner: 'townsfolk' | 'demon'): Game {
  const state = getCurrentState(game)
  const winReason = inferWinReason(state, game, winner)
  trackEvent('game_finished', {
    winner,
    player_count: state.players.length,
    round_count: state.round,
    script: game.scriptId,
  })

  return addHistoryEntry(
    game,
    {
      type: 'game_ended',
      message: [
        {
          type: 'i18n',
          key: winner === 'townsfolk' ? 'history.goodWins' : 'history.evilWins',
        },
      ],
      data: {
        winner,
        winReason: winReason.code,
        winReasonSourceRoleId: winReason.sourceRoleId,
        winReasonSourceEffectType: winReason.sourceEffectType,
      },
    },
    { phase: 'ended', winner },
  )
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get the player IDs of players who died during the last night.
 * Scans history from the last night_resolved to day_started for death entries.
 */
export function getLastNightDeaths(game: Game): string[] {
  const nightResolvedIndex = findLastEventIndex(game, 'night_resolved')
  if (nightResolvedIndex === -1) return []

  const deaths: string[] = []
  for (let i = nightResolvedIndex + 1; i < game.history.length; i++) {
    const entry = game.history[i]
    if (entry.type === 'day_started') break
    if (
      entry.type === 'effect_added' &&
      entry.data.effectType === 'dead' &&
      entry.data.source !== 'narrator'
    ) {
      deaths.push(entry.data.playerId as string)
    }
  }
  return deaths
}

/**
 * Get the set of player IDs who have nominated today.
 */
export function getNominatorsToday(game: Game): Set<string> {
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  if (dayStartIndex === -1) return new Set()
  const ids = new Set<string>()
  for (let i = dayStartIndex + 1; i < game.history.length; i++) {
    if (game.history[i].type === 'nomination') {
      ids.add(game.history[i].data.nominatorId as string)
    }
    if (game.history[i].type === 'nomination_canceled') {
      ids.delete(game.history[i].data.nominatorId as string)
    }
  }
  return ids
}

/**
 * Get the set of player IDs who have voted since the last day started.
 * During the night, this still refers to the immediately preceding day.
 */
export function getVotersToday(game: Game): Set<string> {
  const dayStartIndex = findLastEventIndex(game, 'day_started')
  if (dayStartIndex === -1) return new Set()
  const ids = new Set<string>()
  for (let i = dayStartIndex + 1; i < game.history.length; i++) {
    if (game.history[i].type === 'vote') {
      const votedIds = game.history[i].data.votedIds
      if (Array.isArray(votedIds)) {
        for (const voterId of votedIds) {
          if (typeof voterId === 'string') {
            ids.add(voterId)
          }
        }
      }
    }
  }
  return ids
}

/**
 * Get history messages for a player's night action this night.
 * Used for reviewing completed actions in the Night Dashboard.
 */
export function getNightActionSummary(
  game: Game,
  playerId: string,
  roleId?: string,
  systemStepId?: NightSystemStepId,
): RichMessage[] {
  const nightStartIndex = findLastEventIndex(game, 'night_started')
  if (nightStartIndex === -1) return []

  const messages: RichMessage[] = []
  for (let i = nightStartIndex + 1; i < game.history.length; i++) {
    const entry = game.history[i]
    if (
      entry.type === 'night_action' &&
      entry.data.playerId === playerId &&
      (roleId == null || entry.data.roleId === roleId) &&
      entry.data.systemStepId === systemStepId
    ) {
      messages.push(entry.message)
    }
  }
  return messages
}

export function getNightActionEntries(
  game: Game,
  playerId: string,
  roleId?: string,
  systemStepId?: NightSystemStepId,
): HistoryEntry[] {
  const nightStartIndex = findLastEventIndex(game, 'night_started')
  if (nightStartIndex === -1) return []

  return game.history.filter(
    (entry, index) =>
      index > nightStartIndex &&
      entry.type === 'night_action' &&
      entry.data.playerId === playerId &&
      (roleId == null || entry.data.roleId === roleId) &&
      entry.data.systemStepId === systemStepId,
  )
}

// ============================================================================
// NIGHT DASHBOARD HELPERS
// ============================================================================

export type NightRoleStatus = {
  roleId: string
  playerId: string
  playerName: string
  status: 'pending' | 'done' | 'skipped'
  malfunctioning?: boolean
  falseInfoMode?: FalseInfoMode | null
  systemStepId?: NightSystemStepId
  dashboardKind?:
    | 'minion_info'
    | 'demon_info'
    | 'demon_bluffs'
    | 'demon_creation_deaths'
  skippedReasonCode?: 'evil_info_under_seven'
}

/**
 * Get the status of night roles that actually need to wake this night.
 * Roles that were auto-skipped (shouldWake returned false) are excluded.
 * Returns roles in night order with their current status.
 *
 * Note: reactive follow-ups (like role change reveals) are NOT included here.
 * Those are collected separately via getAvailableNightFollowUps() in the
 * pipeline module and merged by the NightDashboard UI.
 */
export function getNightRolesStatus(game: Game): NightRoleStatus[] {
  const state = getCurrentState(game)

  const nightStartIndex = findLastEventIndex(game, 'night_started')
  const actedEntries = game.history
    .slice(nightStartIndex + 1)
    .filter((e) => e.type === 'night_action' || e.type === 'night_skipped')

  // Track processed player-role combinations so role changes mid-night can
  // still queue the new role if its wake is still ahead.
  const actedNightActionKeys = new Map<
    string,
    'night_action' | 'night_skipped'
  >()
  for (const entry of actedEntries) {
    actedNightActionKeys.set(
      getNightActionKey(
        entry.data.playerId as string,
        entry.data.roleId as string,
        entry.data.systemStepId as NightSystemStepId | undefined,
      ),
      entry.type as 'night_action' | 'night_skipped',
    )
  }
  const queueDirectives = getResolvedNightQueueDirectives(game)

  // Build a player-centric list sorted by nightOrder
  const playersWithNightRoles = getPlayersWithNightRoles(game, state)
  const playersByNightKey = new Map(
    playersWithNightRoles.map(({ player, role }) => [
      getNightActionKey(player.id, role.id),
      { player, role },
    ]),
  )

  const result: NightRoleStatus[] = []
  const insertedImmediate = new Set<string>()

  for (const systemStep of getNightSystemSteps(game, state)) {
    const key = getNightActionKey(
      systemStep.playerId,
      systemStep.roleId,
      systemStep.systemStepId,
    )
    const actedType = actedNightActionKeys.get(key)

    result.push({
      roleId: systemStep.roleId,
      playerId: systemStep.playerId,
      playerName: systemStep.playerName,
      malfunctioning: false,
      systemStepId: systemStep.systemStepId,
      dashboardKind: systemStep.dashboardKind,
      skippedReasonCode: systemStep.skippedReasonCode,
      status:
        actedType === 'night_action'
          ? 'done'
          : actedType === 'night_skipped'
            ? 'skipped'
            : systemStep.shouldRun
              ? 'pending'
              : 'skipped',
    })
  }

  for (const key of queueDirectives.immediateKeys) {
    if (actedNightActionKeys.has(key) || queueDirectives.skipKeys.has(key)) {
      continue
    }

    const queued = playersByNightKey.get(key)
    if (!queued) continue

    const { player, role } = queued
    const forceImmediate = queueDirectives.forceImmediateKeys.has(key)
    if (!canWakeAtNight(game, player, role)) continue
    const shouldWake =
      forceImmediate || !role.shouldWake || role.shouldWake(game, player)
    if (!shouldWake) continue

    result.push({
      roleId: role.id,
      playerId: player.id,
      playerName: player.name,
      malfunctioning: isMalfunctioning(player),
      falseInfoMode: getFalseInfoMode(state, player),
      status: 'pending',
    })
    insertedImmediate.add(key)
  }

  for (const { player, role } of playersWithNightRoles) {
    const key = getNightActionKey(player.id, role.id)
    if (queueDirectives.skipKeys.has(key) || insertedImmediate.has(key)) {
      continue
    }

    const actedType = actedNightActionKeys.get(key)

    if (actedType) {
      // Already processed — keep both acted and skipped rows visible so the
      // storyteller can still see the full order for the night.
      if (actedType === 'night_action') {
        result.push({
          roleId: role.id,
          playerId: player.id,
          playerName: player.name,
          malfunctioning: isMalfunctioning(player),
          falseInfoMode: getFalseInfoMode(state, player),
          status: 'done',
        })
      } else {
        result.push({
          roleId: role.id,
          playerId: player.id,
          playerName: player.name,
          malfunctioning: isMalfunctioning(player),
          falseInfoMode: getFalseInfoMode(state, player),
          status: 'skipped',
        })
      }
    } else {
      // Not yet processed — only include if shouldWake passes
      if (!canWakeAtNight(game, player, role)) {
        continue
      }
      const shouldWake = !role.shouldWake || role.shouldWake(game, player)
      if (shouldWake) {
        result.push({
          roleId: role.id,
          playerId: player.id,
          playerName: player.name,
          malfunctioning: isMalfunctioning(player),
          falseInfoMode: getFalseInfoMode(state, player),
          status: 'pending',
        })
      }
    }
  }

  return result
}

/**
 * Process all auto-skippable night actions from the current position.
 * Returns the updated game with skipped entries applied.
 * Stops when it hits a role that needs manual action or all are done.
 */
export function processAutoSkips(game: Game): Game {
  let updatedGame = game
  while (true) {
    const step = getNextStep(updatedGame)
    if (step.type === 'night_action_skip') {
      updatedGame = skipNightAction(
        updatedGame,
        step.roleId,
        step.playerId,
        step.systemStepId,
      )
    } else {
      break
    }
  }
  return updatedGame
}

// ============================================================================
// MANUAL EFFECT MANAGEMENT
// ============================================================================

/**
 * Manually add an effect to a player (narrator action)
 */
export function addEffectToPlayer(
  game: Game,
  playerId: string,
  effectType: string,
  data?: Record<string, unknown>,
): Game {
  return addHistoryEntry(
    game,
    {
      type: 'effect_added',
      message: [
        {
          type: 'i18n',
          key: 'history.effectAdded',
          params: { player: playerId, effect: effectType },
        },
      ],
      data: { playerId, effectType, source: 'narrator' },
    },
    undefined,
    { [playerId]: [{ type: effectType, data, expiresAt: 'never' }] },
  )
}

/**
 * Manually update the data of an existing effect instance on a player (narrator action).
 * Finds the first effect of the given type and replaces its data.
 */
export function updateEffectData(
  game: Game,
  playerId: string,
  effectType: string,
  data: Record<string, unknown>,
): Game {
  const currentState = getCurrentState(game)
  const player = currentState.players.find((p) => p.id === playerId)
  if (!player) return game

  const hasTargetEffect = player.effects.some((e) => e.type === effectType)
  if (!hasTargetEffect) return game

  // Update the first matching effect instance's data
  const updatedPlayers = currentState.players.map((p) => {
    if (p.id !== playerId) return p
    let found = false
    return {
      ...p,
      effects: p.effects.map((e) => {
        if (!found && e.type === effectType) {
          found = true
          return { ...e, data: { ...e.data, ...data } }
        }
        return e
      }),
    }
  })

  const historyEntry: Omit<HistoryEntry, 'id' | 'timestamp' | 'stateAfter'> = {
    type: 'effect_added',
    message: [
      {
        type: 'i18n',
        key: 'history.effectUpdated',
        params: { player: playerId, effect: effectType },
      },
    ],
    data: { playerId, effectType, source: 'narrator', action: 'update' },
  }

  return addHistoryEntry(game, historyEntry, { players: updatedPlayers })
}

/**
 * Manually remove an effect from a player (narrator action)
 */
export function removeEffectFromPlayer(
  game: Game,
  playerId: string,
  effectType: string,
): Game {
  return addHistoryEntry(
    game,
    {
      type: 'effect_removed',
      message: [
        {
          type: 'i18n',
          key: 'history.effectRemoved',
          params: { player: playerId, effect: effectType },
        },
      ],
      data: { playerId, effectType, source: 'narrator' },
    },
    undefined,
    undefined,
    { [playerId]: [effectType] },
  )
}

/**
 * Reorder players in seating order. This affects all neighbor-based abilities.
 */
export function reorderPlayers(game: Game, orderedPlayerIds: string[]): Game {
  const currentState = getCurrentState(game)

  if (orderedPlayerIds.length !== currentState.players.length) return game

  const byId = new Map(
    currentState.players.map((player) => [player.id, player]),
  )
  const reorderedPlayers = orderedPlayerIds
    .map((playerId) => byId.get(playerId))
    .filter((player): player is PlayerState => player != null)

  if (reorderedPlayers.length !== currentState.players.length) return game

  return addHistoryEntry(
    game,
    {
      type: 'grimoire_reviewed',
      message: [{ type: 'i18n', key: 'history.reseatedPlayers' }],
      data: {
        source: 'narrator',
        playerOrder: reorderedPlayers.map((player) => player.id),
      },
    },
    { players: reorderedPlayers },
  )
}
