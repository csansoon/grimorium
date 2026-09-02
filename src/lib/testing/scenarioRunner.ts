import {
  Game,
  GameState,
  getCurrentState,
  getPlayer,
} from '../types'
import {
  createGame,
  startNight,
  startDay,
  getNextStep,
  applyNightAction,
  skipNightAction,
  nominate,
  cancelNomination,
  resolveVote,
  executeAtEndOfDay,
} from '../game'
import type { NightActionResult, RoleId } from '../roles/types'
import type { ScriptDefinition } from '../scripts/types'
import type { Intent } from '../pipeline/types'
import { applyPipelineChanges, resolveIntent } from '../pipeline'
import { deriveWakeOrderFromRoleIds } from '../scripts/wakeOrder'

export type ScenarioContext = {
  game: Game
  getState: () => GameState
  getCurrentStep: () => ReturnType<typeof getNextStep>
}

type StartNightStep = { type: 'start_night' }
type StartDayStep = { type: 'start_day' }
type ApplyNightActionStep = {
  type: 'apply_night_action'
  result: NightActionResult | ((ctx: ScenarioContext) => NightActionResult)
}
type SkipCurrentNightStep = { type: 'skip_current_night_action' }
type ResolveIntentStep = {
  type: 'resolve_intent'
  intent: Intent | ((ctx: ScenarioContext) => Intent)
}
type NominateStep = {
  type: 'nominate'
  nominatorId: string
  nomineeId: string
}
type CancelNominationStep = {
  type: 'cancel_nomination'
  nominatorId: string
  nomineeId: string
}
type ResolveVoteStep = {
  type: 'resolve_vote'
  nomineeId: string
  voteCount: number
  votedIds?: string[]
}
type ExecuteEodStep = { type: 'execute_end_of_day' }
type DrainNightStep = {
  type: 'drain_night'
  maxSteps?: number
}
type AssertStep = {
  type: 'assert'
  check: (ctx: ScenarioContext) => void
}

export type ScenarioStep =
  | StartNightStep
  | StartDayStep
  | ApplyNightActionStep
  | SkipCurrentNightStep
  | ResolveIntentStep
  | NominateStep
  | CancelNominationStep
  | ResolveVoteStep
  | ExecuteEodStep
  | DrainNightStep
  | AssertStep

export type ScenarioSpec = {
  name: string
  roles: RoleId[]
  scriptId?: string
  scriptName?: string
  steps: ScenarioStep[]
}

function buildScriptSnapshot(
  scriptId: string,
  scriptName: string,
  roles: RoleId[],
): ScriptDefinition {
  return {
    id: scriptId,
    source: 'custom',
    name: scriptName,
    icon: 'settings',
    roles,
    enforceDistribution: false,
    wakeOrder: deriveWakeOrderFromRoleIds(roles),
    isOfficial: false,
  }
}

function buildInitialGame(spec: ScenarioSpec): Game {
  const scriptId = spec.scriptId ?? `scenario-${spec.name.toLowerCase().replace(/\s+/g, '-')}`
  const scriptName = spec.scriptName ?? `Scenario ${spec.name}`
  const scriptSnapshot = buildScriptSnapshot(scriptId, scriptName, spec.roles)
  const players = spec.roles.map((roleId, index) => ({
    name: `P${index + 1}`,
    roleId,
  }))

  return createGame(spec.name, scriptId, players, scriptSnapshot)
}

function assertNightStepIsAction(
  ctx: ScenarioContext,
): { roleId: string; playerId: string; systemStepId?: string } {
  const step = ctx.getCurrentStep()
  if (step.type !== 'night_action' && step.type !== 'night_action_skip') {
    throw new Error(
      `Expected current step to be a night action, got "${step.type}"`,
    )
  }

  return {
    roleId: step.roleId,
    playerId: step.playerId,
    systemStepId: step.systemStepId,
  }
}

export function runScenario(spec: ScenarioSpec): ScenarioContext {
  const ctx: ScenarioContext = {
    game: buildInitialGame(spec),
    getState: () => getCurrentState(ctx.game),
    getCurrentStep: () => getNextStep(ctx.game),
  }

  for (const step of spec.steps) {
    switch (step.type) {
      case 'start_night':
        ctx.game = startNight(ctx.game)
        break
      case 'start_day':
        ctx.game = startDay(ctx.game)
        break
      case 'apply_night_action': {
        const result =
          typeof step.result === 'function' ? step.result(ctx) : step.result
        ctx.game = applyNightAction(ctx.game, result)
        break
      }
      case 'skip_current_night_action': {
        const current = assertNightStepIsAction(ctx)
        ctx.game = skipNightAction(
          ctx.game,
          current.roleId,
          current.playerId,
          current.systemStepId as
            | 'minion_info'
            | 'demon_info'
            | 'demon_bluffs'
            | 'demon_creation_deaths'
            | undefined,
        )
        break
      }
      case 'resolve_intent': {
        const intent =
          typeof step.intent === 'function' ? step.intent(ctx) : step.intent
        const result = resolveIntent(intent, ctx.getState(), ctx.game)
        if (result.type === 'needs_input') {
          throw new Error(
            `Scenario "${spec.name}" needs UI input for intent "${intent.type}"`,
          )
        }
        ctx.game = applyPipelineChanges(ctx.game, result.stateChanges)
        break
      }
      case 'nominate':
        ctx.game = nominate(ctx.game, step.nominatorId, step.nomineeId)
        break
      case 'cancel_nomination':
        ctx.game = cancelNomination(ctx.game, step.nominatorId, step.nomineeId)
        break
      case 'resolve_vote':
        ctx.game = resolveVote(
          ctx.game,
          step.nomineeId,
          step.voteCount,
          step.votedIds,
        )
        break
      case 'execute_end_of_day':
        ctx.game = executeAtEndOfDay(ctx.game)
        break
      case 'drain_night': {
        const maxSteps = step.maxSteps ?? 80
        for (let i = 0; i < maxSteps; i++) {
          const current = ctx.getCurrentStep()
          if (current.type === 'night_waiting') break
          if (
            current.type !== 'night_action' &&
            current.type !== 'night_action_skip'
          ) {
            break
          }
          ctx.game = skipNightAction(
            ctx.game,
            current.roleId,
            current.playerId,
            current.systemStepId,
          )
        }
        break
      }
      case 'assert':
        step.check(ctx)
        break
      default:
        throw new Error(`Unhandled scenario step`)
    }
  }

  return ctx
}

export function getPlayerByRole(state: GameState, roleId: RoleId) {
  return state.players.find((player) => player.roleId === roleId)
}

export function getPlayerByName(state: GameState, name: string) {
  return state.players.find((player) => player.name === name)
}

export function requirePlayer(state: GameState, playerId: string) {
  const player = getPlayer(state, playerId)
  if (!player) {
    throw new Error(`Missing player ${playerId}`)
  }
  return player
}
