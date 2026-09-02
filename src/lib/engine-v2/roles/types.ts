import type { EngineState } from '../state'
import type {
  AbilityUsagePolicy,
  AbilityOverride,
  DeathCause,
  DefensiveModifier,
  EngineIntent,
  EnginePlayer,
  EnginePhase,
  EngineEvent,
  MalfunctionPolicy,
  RoleTeam,
  TimedStatusEffect,
  TriggerRegistration,
  TriggerEvent,
} from '../types'

export type EngineRoleContext = {
  state: EngineState
  player: EnginePlayer
}

export type EngineRoleAction = {
  kind: string
  [key: string]: unknown
}

export type EngineRoleCompositeResult = {
  baseState: EngineState
  intents: EngineIntent[]
}

export type EngineRoleResult =
  | EngineState
  | EngineIntent
  | EngineIntent[]
  | EngineRoleCompositeResult

export type RoleTriggerSubject =
  | {
      kind: 'player'
      playerId: string
      roleId?: string
      alignment?: EnginePlayer['alignment']
      cause?: DeathCause
      phase?: EnginePhase
    }
  | {
      kind: 'phase'
      phase: EnginePhase
    }

export type EngineRoleTriggerOccurrence = {
  name:
    | 'onDayStarted'
    | 'onNominationStarted'
    | 'onNominationLocked'
    | 'onVoteOpened'
    | 'onVoteCast'
    | 'onVoteClosed'
    | 'onBlockUpdated'
    | 'onExecutionResolved'
    | 'onExecutionSkipped'
    | 'onPlayerExecuted'
    | 'onNoExecution'
    | 'onDayEnded'
    | 'onPlayerDied'
    | 'onPlayerRevived'
    | 'onRoleChanged'
    | 'onRoleEntered'
    | 'onAlignmentChanged'
    | 'onPhaseStarted'
  triggerEvent?: TriggerEvent
  engineEvent?: EngineEvent
  subject: RoleTriggerSubject
}

export type EngineRoleTriggerScope =
  | {
      subject: 'self'
    }
  | {
      subject: 'any'
      playerFilter?: {
        roleIds?: string[]
        roleTeams?: RoleTeam[]
        alignments?: EnginePlayer['alignment'][]
        deathCauses?: DeathCause[]
        phases?: EnginePhase[]
      }
    }
  | {
      subject: 'phase'
      phases?: EnginePhase[]
    }

export type EngineRoleTrigger = {
  id: string
  event: EngineRoleTriggerOccurrence['name']
  scope: EngineRoleTriggerScope
  malfunctionPolicy?: MalfunctionPolicy
  when?: (ctx: EngineRoleContext, occurrence: EngineRoleTriggerOccurrence) => boolean
  handleMalfunction?: (
    ctx: EngineRoleContext,
    occurrence: EngineRoleTriggerOccurrence,
  ) => EngineRoleResult
  handle: (ctx: EngineRoleContext, occurrence: EngineRoleTriggerOccurrence) => EngineRoleResult
}

export type EngineRolePhaseTrigger = Omit<EngineRoleTrigger, 'event' | 'scope'> & {
  phases?: EnginePhase[]
}

export type EngineRoleEntryTrigger = Omit<EngineRoleTrigger, 'event' | 'scope'> & {
  scope?: Extract<EngineRoleTriggerScope, { subject: 'self' | 'any' }>
}

export type EngineRoleDefinition = {
  id: string
  roleTeam?: RoleTeam
  passiveMalfunctionPolicy?: 'suppressed_passive'
  abilityUsage?: AbilityUsagePolicy[]
  shouldQueueNightAction?: (ctx: EngineRoleContext) => boolean
  getDynamicAbilityOverrides?: (ctx: EngineRoleContext) => AbilityOverride[]
  getDynamicStatusEffects?: (ctx: EngineRoleContext) => TimedStatusEffect[]
  getDynamicModifiers?: (ctx: EngineRoleContext) => DefensiveModifier[]
  getTriggerRegistrations?: (ctx: EngineRoleContext) => TriggerRegistration[]
  getPhaseTriggers?: (ctx: EngineRoleContext) => EngineRolePhaseTrigger[]
  getRoleEntryTriggers?: (ctx: EngineRoleContext) => EngineRoleEntryTrigger[]
  getRoleTriggers?: (ctx: EngineRoleContext) => EngineRoleTrigger[]
  performAbility?: (
    ctx: EngineRoleContext,
    action: EngineRoleAction,
  ) => EngineRoleResult
}
