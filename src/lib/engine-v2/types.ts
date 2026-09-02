export type EnginePhase =
  | 'setup'
  | 'first_night'
  | 'other_night'
  | 'dawn'
  | 'day'
  | 'execution'
  | 'end_of_day'

export type Alignment = 'good' | 'evil'
export type RoleTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler'

export type LifeStateKind =
  | 'alive'
  | 'dead'
  | 'alive_publicly_dead'
  | 'dead_revivable'
  | 'undead_hidden'

export type LifeProjection = {
  trueState: 'alive' | 'dead'
  publicState: 'alive' | 'dead'
  countsAsAliveForWin: boolean
  canWake: boolean
  canNominate: boolean
  canVote: boolean
}

export type PlayerLifeState = {
  kind: LifeStateKind
  deathCount: number
  projection: LifeProjection
}

export type EnginePlayer = {
  id: string
  name: string
  roleId: string
  alignment: Alignment
  life: PlayerLifeState
  notes?: Record<string, unknown>
}

export type DayNominationStatus = 'opened' | 'closed' | 'cancelled'

export type DayNominationRecord = {
  id: string
  nominatorId: string
  nomineeId: string
  votes: string[]
  ghostVotes: string[]
  status: DayNominationStatus
  createdAtEventIndex?: number
  closedAtEventIndex?: number
}

export type DayBlockState = {
  nomineeId: string | null
  voteCount: number
  tied: boolean
  nominationId: string | null
}

export type DayExecutionState = {
  status: 'pending' | 'resolved' | 'skipped'
  executedPlayerId: string | null
  reason?: string
  nominationId?: string | null
}

export type DayState = {
  nominations: DayNominationRecord[]
  currentNominationId: string | null
  block: DayBlockState
  votingOpen: boolean
  execution: DayExecutionState
  ghostVotesSpentByPlayerId: Record<string, boolean>
}

export type WinningTeam = 'townsfolk' | 'demon'

export type GameOutcomeState = {
  ended: boolean
  winner: WinningTeam | null
  reason?: string
  title?: string
  sourcePlayerId?: string
  sourceRoleId?: string
}

export type AbilityUsageCadence =
  | 'at_will'
  | 'once_per_game'
  | 'once_per_night'
  | 'n_times_per_game'

export type AbilityUsageConsumeWhen = 'on_attempt' | 'on_success'
export type AbilityAllowedWhile = 'alive_only' | 'dead_only' | 'alive_or_dead'
export type MalfunctionPolicy =
  | 'fail_closed'
  | 'storyteller_arbitrary_info'
  | 'storyteller_constrained_falsehood'

export type AbilityUsagePolicy = {
  abilityId: string
  actionKind: string
  cadence: AbilityUsageCadence
  maxUses?: number
  consumeWhen: AbilityUsageConsumeWhen
  allowedWhile?: AbilityAllowedWhile
  allowWhenMalfunctioning?: boolean
  malfunctionPolicy?: MalfunctionPolicy
}

export type AbilityUsageRecord = {
  useCount: number
  lastUsedNightSequence?: number
}

export type AbilityOverride = {
  id: string
  playerId: string
  abilityId?: string
  allowWhileDead?: boolean
  suppress?: boolean
  sourcePlayerId?: string
  sourceRoleId?: string
  reason?: string
}

export type StatusEffectType = 'poisoned' | 'drunk'

export type TimedStatusEffect = {
  id: string
  type: StatusEffectType
  targetPlayerId: string
  sourcePlayerId?: string
  sourceRoleId?: string
  reason?: string
}

export type ActiveMadness = {
  id: string
  targetPlayerId: string
  claimRoleId?: string
  sourcePlayerId?: string
  sourceRoleId?: string
  reason: string
  expiresAt?: TriggerSchedule
}

export type PendingMadnessConsequence = {
  id: string
  targetPlayerId: string
  claimRoleId?: string
  sourcePlayerId?: string
  sourceRoleId?: string
  reason: string
  createdDuringPhase: EnginePhase
}

export type StorytellerNotice = {
  id: string
  resolutionMode: 'automatic'
  title: string
  message: string
  playerIds?: string[]
  sourcePlayerId?: string
  sourceRoleId?: string
}

export type StorytellerResolutionAction =
  | {
      kind: 'set_note_value'
      playerId: string
      key: string
      value: unknown
    }
  | {
      kind: 'set_note_selected_player'
      playerId: string
      key: string
    }
  | {
      kind: 'set_note_object_field_to_selected_player'
      playerId: string
      key: string
      field: string
    }
  | {
      kind: 'clear_note'
      playerId: string
      key: string
    }
  | {
      kind: 'apply_status_effect'
      effect: TimedStatusEffect
      expiresAt?: ScheduledStatusEffect['expiresAt']
    }
  | {
      kind: 'apply_status_effect_to_selected_player'
      effect: Omit<TimedStatusEffect, 'id' | 'targetPlayerId'>
      expiresAt?: ScheduledStatusEffect['expiresAt']
    }
  | {
      kind: 'queue_information_from_selection'
      packet: Omit<InformationPacket, 'id' | 'fragments'>
      fragments: Array<
        | InformationFragment
        | { kind: 'selected_role' }
        | { kind: 'selected_player' }
        | { kind: 'selected_boolean' }
        | { kind: 'selected_number' }
        | { kind: 'selected_text' }
        | { kind: 'selected_role_pair_first' }
        | { kind: 'selected_role_pair_second' }
        | { kind: 'selected_player_pair_first' }
        | { kind: 'selected_player_pair_second' }
      >
    }
  | {
      kind: 'queue_role_signal_decoy_choice'
      infoPlayerId: string
      sourcePlayerId?: string
      sourceRoleId?: string
      roleChoiceTitle: string
      roleChoiceMessage: string
      decoyChoiceTitle: string
      decoyChoiceMessagePrefix: string
      packetTitle: string
      packetSummaryPrefix: string
    }
  | {
      kind: 'emit_notice_if_selected_player_alignment'
      alignments: Alignment[]
      notice: Omit<StorytellerNotice, 'id' | 'resolutionMode'>
    }
  | {
      kind: 'propose_game_outcome_if_selected_player_alignment'
      alignments: Alignment[]
      winner: WinningTeam
      title: string
      message: string
      reason: string
      sourcePlayerId?: string
      sourceRoleId?: string
    }
  | {
      kind: 'resolve_game_outcome'
      winner: WinningTeam
      title: string
      message: string
      reason: string
      sourcePlayerId?: string
      sourceRoleId?: string
      confirmValue?: string
    }
  | {
      kind: 'resolve_special_execution'
      executedPlayerId: string
      nominationId?: string | null
      sourcePlayerId?: string
      reason: string
      confirmValue?: string
    }
;

export type StorytellerChoice = {
  id: string
  resolutionMode: 'choice_required' | 'storyteller_arbitrary'
  kind:
    | 'player_selection'
    | 'role_selection'
    | 'boolean_selection'
    | 'number_selection'
  title: string
  message: string
  sourcePlayerId?: string
  sourceRoleId?: string
  candidatePlayerIds: string[]
  candidateLabels?: Record<string, string>
  minSelections?: number
  maxSelections?: number
  onResolve?: StorytellerResolutionAction[]
}

export type InformationFragment =
  | { kind: 'text'; text: string }
  | { kind: 'role'; roleId: string }
  | { kind: 'alignment'; alignment: Alignment }
  | { kind: 'player'; playerId: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }

export type InformationPacket = {
  id: string
  audience: 'player' | 'storyteller'
  playerId?: string
  title: string
  summary?: string
  fragments: InformationFragment[]
  sourcePlayerId?: string
  sourceRoleId?: string
}

export type StatusIntent =
  | {
      id: string
      kind: 'apply_status'
      effect: TimedStatusEffect
      expiresAt?: ScheduledStatusEffect['expiresAt']
    }
  | {
      id: string
      kind: 'remove_status'
      effectId: string
    }

export type StorytellerIntent =
  | {
      id: string
      kind: 'storyteller_notice'
      notice: StorytellerNotice
    }
  | {
      id: string
      kind: 'storyteller_choice'
      choice: StorytellerChoice
    }

export type InformationIntent = {
  id: string
  kind: 'information'
  packet: InformationPacket
}

export type DayIntent =
  | {
      id: string
      kind: 'day_start_nomination'
      nominatorId: string
      nomineeId: string
    }
  | {
      id: string
      kind: 'day_lock_nomination'
      nominationId: string
    }
  | {
      id: string
      kind: 'day_open_vote'
      nominationId: string
    }
  | {
      id: string
      kind: 'day_cast_vote'
      nominationId: string
      voterId: string
    }
  | {
      id: string
      kind: 'day_close_vote'
      nominationId: string
    }
  | {
      id: string
      kind: 'day_resolve_execution'
      reason?: string
    }

export type TransformationIntent =
  | {
      id: string
      kind: 'change_role'
      playerId: string
      newRoleId: string
      reason?: string
    }
  | {
      id: string
      kind: 'change_alignment'
      playerId: string
      newAlignment: Alignment
      reason?: string
    }
  | {
      id: string
      kind: 'swap_roles'
      firstPlayerId: string
      secondPlayerId: string
      reason?: string
    }

export type EngineIntent =
  | {
      id: string
      kind: 'lethal'
      intent: LethalIntent
    }
  | {
      id: string
      kind: 'revive'
      targetPlayerId: string
      sourcePlayerId?: string
      sourceRoleId?: string
      reason?: string
      clearStatusEffects?: boolean
      clearTargetModifiers?: boolean
    }
  | StatusIntent
  | StorytellerIntent
  | InformationIntent
  | DayIntent
  | TransformationIntent

export type LethalIntentKind = 'attack' | 'kill' | 'execute'

export type DeathCause =
  | 'demon_attack'
  | 'execution'
  | 'role_ability'
  | 'storyteller_arbitrary'
  | 'curse'
  | 'self_inflicted'

export type TriggerEventType =
  | 'day_started'
  | 'nomination_started'
  | 'nomination_locked'
  | 'vote_opened'
  | 'vote_cast'
  | 'vote_closed'
  | 'block_updated'
  | 'execution_resolved'
  | 'execution_skipped'
  | 'player_executed'
  | 'no_execution'
  | 'nominator_locked'
  | 'day_ended'
  | 'phase_started'
  | 'player_died'
  | 'player_revived'
  | 'player_role_changed'
  | 'player_alignment_changed'

export type TriggerEvent = {
  type: TriggerEventType
  phase?: EnginePhase
  playerId?: string
  data?: Record<string, unknown>
}

export type DefenseKind =
  | 'attack_protection'
  | 'execution_protection'
  | 'survival_charge'
  | 'conditional_immortality'

export type DefenseBypass =
  | 'all_protection'
  | 'attack_protection'
  | 'execution_protection'
  | 'survival_charge'
  | 'conditional_immortality'
  | 'all_defense'

export type LethalIntent = {
  id: string
  kind: LethalIntentKind
  sourcePlayerId?: string
  targetPlayerId: string
  cause: DeathCause
  phase: EnginePhase
  reason?: string
  bypasses?: DefenseBypass[]
  tags?: string[]
}

export type ScheduledLethalIntent = {
  id: string
  intent: LethalIntent
  scheduledFor: TriggerSchedule
}

export type ScheduledStatusEffect = {
  id: string
  effect: TimedStatusEffect
  scheduledFor: TriggerSchedule
  expiresAt?: TriggerSchedule
}

export type TriggerSchedule =
  | {
      mode: 'phase'
      phase: EnginePhase
    }
  | {
      mode: 'trigger'
      trigger: TriggerEventType
      playerId?: string
    }

export type TriggerRegistrationAction =
  | {
      kind: 'lethal_intent'
      intent: LethalIntent
    }
  | {
      kind: 'apply_status_effect'
      effect: TimedStatusEffect
      expiresAt?: ScheduledStatusEffect['expiresAt']
    }
  | {
      kind: 'remove_status_effect'
      effectId: string
    }
  | {
      kind: 'set_note'
      playerId: string
      key: string
      value: unknown
    }
  | {
      kind: 'clear_note'
      playerId: string
      key: string
    }
  | {
      kind: 'remove_modifier'
      modifierId: string
    }

export type TriggerRegistration = {
  id: string
  trigger:
    | {
        mode: 'phase'
        phase: EnginePhase
      }
    | {
        mode: 'event'
        trigger: TriggerEventType
        playerId?: string
      }
  action: TriggerRegistrationAction
  consumeWhen?: 'on_fire' | 'never'
  expiresAt?: TriggerSchedule
  once?: boolean
  label?: string
}

export type ResolutionBundleParticipantOperation =
  | {
      kind: 'lethal_intent'
      intent: LethalIntent
    }
  | ({
      kind: 'revive'
    } & {
      targetPlayerId: string
      sourcePlayerId?: string
      sourceRoleId?: string
      reason?: string
      clearStatusEffects?: boolean
      clearTargetModifiers?: boolean
    })
  | {
      kind: 'none'
      reason?: string
    }

export type ResolutionBundleParticipant = {
  id: string
  playerId: string
  label?: string
  operation: ResolutionBundleParticipantOperation
}

export type ResolutionBundleFollowUp =
  | {
      kind: 'lethal_intent'
      intent: LethalIntent
    }
  | ({
      kind: 'revive'
    } & {
      targetPlayerId: string
      sourcePlayerId?: string
      sourceRoleId?: string
      reason?: string
      clearStatusEffects?: boolean
      clearTargetModifiers?: boolean
    })

export type ResolutionBundle = {
  id: string
  sourceRoleId?: string
  sourcePlayerId?: string
  phase: EnginePhase
  label?: string
  participants: ResolutionBundleParticipant[]
  evaluateFollowUps?: (state: import('./state').EngineState) => ResolutionBundleFollowUp[]
}

export type EngineEvent =
  | {
      type: 'intent_created'
      intent: LethalIntent
    }
  | {
      type: 'intent_resolved'
      intent: LethalIntent
      outcome: LethalOutcome
    }
  | {
      type: 'death_prevented'
      intent: LethalIntent
      outcome: Extract<LethalOutcome, { kind: 'prevented' }>
    }
  | {
      type: 'death_survived'
      intent: LethalIntent
      outcome: Extract<LethalOutcome, { kind: 'survived' }>
    }
  | {
      type: 'player_died'
      intent: LethalIntent
      outcome: Extract<LethalOutcome, { kind: 'dead' }>
    }
  | {
      type: 'player_revived'
      playerId: string
      sourcePlayerId?: string
      sourceRoleId?: string
      reason?: string
    }
  | {
      type: 'player_role_changed'
      playerId: string
      previousRoleId: string
      newRoleId: string
      reason?: string
    }
  | {
      type: 'player_alignment_changed'
      playerId: string
      previousAlignment: Alignment
      newAlignment: Alignment
      reason?: string
    }
  | {
      type: 'public_death_recorded'
      intent: LethalIntent
      outcome: Extract<LethalOutcome, { kind: 'publicly_dead_but_alive' }>
    }
  | {
      type: 'intent_scheduled'
      scheduledIntent: ScheduledLethalIntent
    }
  | {
      type: 'scheduled_intent_released'
      scheduledIntent: ScheduledLethalIntent
      triggerEvent: TriggerEvent
    }
  | {
      type: 'phase_changed'
      phase: EnginePhase
    }
  | {
      type: 'trigger_recorded'
      triggerEvent: TriggerEvent
    }
  | {
      type: 'status_effect_scheduled'
      scheduledEffect: ScheduledStatusEffect
    }
  | {
      type: 'status_effect_applied'
      effect: TimedStatusEffect
    }
  | {
      type: 'status_effect_expired'
      effect: TimedStatusEffect
    }
  | {
      type: 'trigger_registration_added'
      registration: TriggerRegistration
    }
  | {
      type: 'trigger_registration_fired'
      registration: TriggerRegistration
      triggerEvent: TriggerEvent
    }
  | {
      type: 'trigger_registration_expired'
      registration: TriggerRegistration
      triggerEvent: TriggerEvent
    }
  | {
      type: 'day_nomination_started'
      nomination: DayNominationRecord
    }
  | {
      type: 'day_nomination_locked'
      nominationId: string
    }
  | {
      type: 'day_vote_opened'
      nominationId: string
    }
  | {
      type: 'day_vote_cast'
      nominationId: string
      voterId: string
      ghostVote: boolean
    }
  | {
      type: 'day_vote_closed'
      nominationId: string
      voteCount: number
      ghostVoteCount: number
      totalVotes: number
    }
  | {
      type: 'day_block_updated'
      block: DayBlockState
    }
  | {
      type: 'day_execution_resolved'
      executedPlayerId: string
      nominationId?: string | null
      reason?: string
    }
  | {
      type: 'day_execution_skipped'
      reason?: string
    }
  | {
      type: 'game_outcome_resolved'
      winner: WinningTeam
      title: string
      message: string
      reason: string
      sourcePlayerId?: string
      sourceRoleId?: string
    }
  | {
      type: 'game_outcome_declined'
      winner: WinningTeam
      title: string
      message: string
      reason: string
      sourcePlayerId?: string
      sourceRoleId?: string
    }
  | {
      type: 'player_note_set'
      playerId: string
      key: string
      value: unknown
    }
  | {
      type: 'player_note_cleared'
      playerId: string
      key: string
    }
  | {
      type: 'madness_applied'
      madness: ActiveMadness
    }
  | {
      type: 'madness_cleared'
      madness: ActiveMadness
      reason?: string
    }
  | {
      type: 'madness_broken'
      madness: ActiveMadness
      reason?: string
    }
  | {
      type: 'pending_madness_consequence_added'
      consequence: PendingMadnessConsequence
    }
  | {
      type: 'pending_madness_consequence_cleared'
      consequence: PendingMadnessConsequence
      reason?: string
    }
  | {
      type: 'ability_use_recorded'
      playerId: string
      abilityId: string
      actionKind: string
      useCount: number
      cadence: AbilityUsageCadence
    }
  | {
      type: 'ability_override_added'
      override: AbilityOverride
    }
  | {
      type: 'ability_override_removed'
      override: AbilityOverride
    }
  | {
      type: 'bundle_started'
      bundleId: string
      label?: string
      sourcePlayerId?: string
      sourceRoleId?: string
    }
  | {
      type: 'bundle_participant_resolved'
      bundleId: string
      participantId: string
      playerId: string
      operation: ResolutionBundleParticipantOperation['kind']
    }
  | {
      type: 'bundle_follow_up_enqueued'
      bundleId: string
      followUp: ResolutionBundleFollowUp['kind']
      targetPlayerId?: string
    }
  | {
      type: 'bundle_completed'
      bundleId: string
    }
  | {
      type: 'storyteller_notice_added'
      notice: StorytellerNotice
    }
  | {
      type: 'storyteller_notice_dismissed'
      notice: StorytellerNotice
    }
  | {
      type: 'storyteller_choice_requested'
      choice: StorytellerChoice
    }
  | {
      type: 'storyteller_choice_resolved'
      choice: StorytellerChoice
      selectedPlayerId: string
    }
  | {
      type: 'information_queued'
      packet: InformationPacket
    }
  | {
      type: 'information_delivered'
      packet: InformationPacket
    }

export type LethalOutcome =
  | { kind: 'no_effect'; reason: string }
  | { kind: 'suppressed'; reason: string }
  | { kind: 'prevented'; reason: string; byModifierIds: string[] }
  | { kind: 'survived'; reason: string; byModifierIds: string[] }
  | { kind: 'dead'; cause: DeathCause }
  | { kind: 'publicly_dead_but_alive'; reason: string; byModifierIds: string[] }

export type ResolveContext = {
  state: import('./state').EngineState
  intent: LethalIntent
}

export type BaseModifier = {
  id: string
  sourcePlayerId?: string
  targetPlayerId?: string
  enabled?: boolean
  priority?: number
  reason?: string
  appliesWhen?: (ctx: ResolveContext) => boolean
}

export type ProtectionModifier = BaseModifier & {
  kind: 'attack_protection' | 'execution_protection'
}

export type SurvivalModifier = BaseModifier & {
  kind: 'survival_charge'
  charges: number
  consumeOnUse?: boolean
  survivalOutcome?: 'survived' | 'publicly_dead_but_alive'
  consumedNoteKey?: string
}

export type ConditionalImmortalityModifier = BaseModifier & {
  kind: 'conditional_immortality'
}

export type DefensiveModifier =
  | ProtectionModifier
  | SurvivalModifier
  | ConditionalImmortalityModifier

export type ResolvedDefense = {
  modifier: DefensiveModifier
  bypassed: boolean
}

export type ResolvedLethalIntent = {
  intent: LethalIntent
  applicableDefenses: ResolvedDefense[]
  outcome: LethalOutcome
}

export type ResolutionTrace = {
  intent: LethalIntent
  defenses: ResolvedDefense[]
  outcome: LethalOutcome
  committedEvents: EngineEvent[]
  aftermathEvents: EngineEvent[]
}

export type AftermathHandler = (
  state: import('./state').EngineState,
  event: EngineEvent,
) => import('./state').EngineState
