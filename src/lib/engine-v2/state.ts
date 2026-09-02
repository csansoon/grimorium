import type {
  ActiveMadness,
  AftermathHandler,
  AbilityOverride,
  DayState,
  DefensiveModifier,
  EnginePhase,
  EnginePlayer,
  GameOutcomeState,
  LethalIntent,
  PlayerLifeState,
  ScheduledLethalIntent,
  ScheduledStatusEffect,
  InformationPacket,
  StorytellerChoice,
  StorytellerNotice,
  TimedStatusEffect,
  TriggerRegistration,
  ResolutionTrace,
  PendingMadnessConsequence,
} from './types'
import {
  applyStatusEffect,
  createTimedStatusEffect,
  scheduleStatusEffect,
} from './effects'
import { findRoleHolder } from './roleHelpers'
import { resolveSpecialExecution } from './day'

export type EngineState = {
  phase: EnginePhase
  nightSequence: number
  day: DayState
  gameOutcome: GameOutcomeState
  players: EnginePlayer[]
  abilityUsage: Record<string, import('./types').AbilityUsageRecord>
  abilityOverrides: import('./types').AbilityOverride[]
  activeModifiers: DefensiveModifier[]
  pendingIntents: LethalIntent[]
  scheduledIntents: ScheduledLethalIntent[]
  statusEffects: TimedStatusEffect[]
  scheduledEffects: ScheduledStatusEffect[]
  activeTimedEffects: ScheduledStatusEffect[]
  activeMadnesses: ActiveMadness[]
  pendingMadnessConsequences: PendingMadnessConsequence[]
  pendingInformation: InformationPacket[]
  storytellerNotices: StorytellerNotice[]
  pendingStorytellerChoices: StorytellerChoice[]
  triggerRegistrations: TriggerRegistration[]
  lastResolutionTrace: ResolutionTrace | null
  events: import('./types').EngineEvent[]
  aftermathHandlers: AftermathHandler[]
}

export function createAliveLifeState(): PlayerLifeState {
  return {
    kind: 'alive',
    deathCount: 0,
    projection: {
      trueState: 'alive',
      publicState: 'alive',
      countsAsAliveForWin: true,
      canWake: true,
      canNominate: true,
      canVote: true,
    },
  }
}

export function createRevivedLifeState(deathCount: number): PlayerLifeState {
  return {
    kind: 'alive',
    deathCount,
    projection: {
      trueState: 'alive',
      publicState: 'alive',
      countsAsAliveForWin: true,
      canWake: true,
      canNominate: true,
      canVote: true,
    },
  }
}

export function createDeadLifeState(
  deathCount = 1,
  kind: PlayerLifeState['kind'] = 'dead',
): PlayerLifeState {
  const trueState =
    kind === 'alive_publicly_dead' || kind === 'undead_hidden' ? 'alive' : 'dead'
  return {
    kind,
    deathCount,
    projection: {
      trueState,
      publicState: 'dead',
      countsAsAliveForWin: kind === 'alive_publicly_dead' || kind === 'undead_hidden',
      canWake: kind === 'alive_publicly_dead' || kind === 'undead_hidden',
      canNominate: false,
      canVote: false,
    },
  }
}

export function createEmptyDayState(): DayState {
  return {
    nominations: [],
    currentNominationId: null,
    block: {
      nomineeId: null,
      voteCount: 0,
      tied: false,
      nominationId: null,
    },
    votingOpen: false,
    execution: {
      status: 'pending',
      executedPlayerId: null,
      nominationId: null,
    },
    ghostVotesSpentByPlayerId: {},
  }
}

export function createActiveGameOutcomeState(): GameOutcomeState {
  return {
    ended: false,
    winner: null,
  }
}

export function createEngineState(
  players: EnginePlayer[],
  phase: EnginePhase = 'other_night',
): EngineState {
  return {
    phase,
    nightSequence: 0,
    day: createEmptyDayState(),
    gameOutcome: createActiveGameOutcomeState(),
    players,
    abilityUsage: {},
    abilityOverrides: [],
    activeModifiers: [],
    pendingIntents: [],
    scheduledIntents: [],
    statusEffects: [],
    scheduledEffects: [],
    activeTimedEffects: [],
    activeMadnesses: [],
    pendingMadnessConsequences: [],
    pendingInformation: [],
    storytellerNotices: [],
    pendingStorytellerChoices: [],
    triggerRegistrations: [],
    lastResolutionTrace: null,
    events: [],
    aftermathHandlers: [],
  }
}

export function cloneEngineState(state: EngineState): EngineState {
  return {
    ...state,
    nightSequence: state.nightSequence,
    day: {
      currentNominationId: state.day.currentNominationId,
      votingOpen: state.day.votingOpen,
      block: { ...state.day.block },
      execution: { ...state.day.execution },
      ghostVotesSpentByPlayerId: { ...state.day.ghostVotesSpentByPlayerId },
      nominations: state.day.nominations.map((nomination) => ({
        ...nomination,
        votes: [...nomination.votes],
        ghostVotes: [...nomination.ghostVotes],
      })),
    },
    gameOutcome: { ...state.gameOutcome },
    players: state.players.map((player) => ({
      ...player,
      life: {
        ...player.life,
        projection: { ...player.life.projection },
      },
      notes: player.notes ? { ...player.notes } : undefined,
    })),
    abilityUsage: Object.fromEntries(
      Object.entries(state.abilityUsage).map(([key, value]) => [key, { ...value }]),
    ),
    abilityOverrides: state.abilityOverrides.map((override) => ({ ...override })),
    activeModifiers: state.activeModifiers.map((modifier) => ({ ...modifier })),
    pendingIntents: state.pendingIntents.map((intent) => ({ ...intent })),
    scheduledIntents: state.scheduledIntents.map((scheduledIntent) => ({
      ...scheduledIntent,
      intent: { ...scheduledIntent.intent },
      scheduledFor: { ...scheduledIntent.scheduledFor },
    })),
    statusEffects: state.statusEffects.map((effect) => ({ ...effect })),
  scheduledEffects: state.scheduledEffects.map((scheduledEffect) => ({
      ...scheduledEffect,
      effect: { ...scheduledEffect.effect },
      scheduledFor: { ...scheduledEffect.scheduledFor },
      expiresAt: scheduledEffect.expiresAt ? { ...scheduledEffect.expiresAt } : undefined,
    })),
    activeTimedEffects: state.activeTimedEffects.map((scheduledEffect) => ({
      ...scheduledEffect,
      effect: { ...scheduledEffect.effect },
      scheduledFor: { ...scheduledEffect.scheduledFor },
      expiresAt: scheduledEffect.expiresAt ? { ...scheduledEffect.expiresAt } : undefined,
    })),
    activeMadnesses: state.activeMadnesses.map((madness) => ({
      ...madness,
      expiresAt: madness.expiresAt ? { ...madness.expiresAt } : undefined,
    })),
    pendingMadnessConsequences: state.pendingMadnessConsequences.map((consequence) => ({
      ...consequence,
    })),
    pendingInformation: state.pendingInformation.map((packet) => ({
      ...packet,
      fragments: packet.fragments.map((fragment) => ({ ...fragment })),
    })),
    storytellerNotices: state.storytellerNotices.map((notice) => ({
      ...notice,
      playerIds: notice.playerIds ? [...notice.playerIds] : undefined,
    })),
    pendingStorytellerChoices: state.pendingStorytellerChoices.map((choice) =>
      ({
        ...choice,
        candidatePlayerIds: [...choice.candidatePlayerIds],
        onResolve: choice.onResolve
          ? choice.onResolve.map((action) =>
              action.kind === 'apply_status_effect'
                ? {
                    ...action,
                    effect: { ...action.effect },
                    expiresAt: action.expiresAt ? { ...action.expiresAt } : undefined,
                  }
                : action.kind === 'apply_status_effect_to_selected_player'
                  ? {
                      ...action,
                      effect: { ...action.effect },
                      expiresAt: action.expiresAt ? { ...action.expiresAt } : undefined,
                    }
                  : action.kind === 'queue_role_signal_decoy_choice'
                    ? {
                        ...action,
                      }
                  : action.kind === 'queue_information_from_selection'
                    ? {
                        ...action,
                        packet: { ...action.packet },
                        fragments: action.fragments.map((fragment) => ({ ...fragment })),
                      }
                  : { ...action },
            )
          : undefined,
      }),
    ),
    triggerRegistrations: state.triggerRegistrations.map((registration) => ({
      ...registration,
      trigger: { ...registration.trigger },
      expiresAt: registration.expiresAt ? { ...registration.expiresAt } : undefined,
      action:
        registration.action.kind === 'apply_status_effect'
          ? {
              ...registration.action,
              effect: { ...registration.action.effect },
              expiresAt: registration.action.expiresAt
                ? { ...registration.action.expiresAt }
                : undefined,
            }
          : { ...registration.action },
    })),
    lastResolutionTrace: state.lastResolutionTrace
      ? {
          ...state.lastResolutionTrace,
          intent: { ...state.lastResolutionTrace.intent },
          defenses: state.lastResolutionTrace.defenses.map((defense) => ({
            ...defense,
            modifier: { ...defense.modifier },
          })),
          outcome: { ...state.lastResolutionTrace.outcome },
          committedEvents: [...state.lastResolutionTrace.committedEvents],
          aftermathEvents: [...state.lastResolutionTrace.aftermathEvents],
        }
      : null,
    events: [...state.events],
    aftermathHandlers: [...state.aftermathHandlers],
  }
}

export function getPlayer(
  state: EngineState,
  playerId: string,
): EnginePlayer | undefined {
  return state.players.find((player) => player.id === playerId)
}

export function updatePlayer(
  state: EngineState,
  playerId: string,
  updater: (player: EnginePlayer) => EnginePlayer,
): EngineState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? updater(player) : player,
    ),
  }
}

export function setPlayerNote(
  state: EngineState,
  playerId: string,
  key: string,
  value: unknown,
): EngineState {
  const player = getPlayer(state, playerId)
  if (!player) {
    return state
  }

  return {
    ...updatePlayer(state, playerId, (currentPlayer) => ({
      ...currentPlayer,
      notes: {
        ...(currentPlayer.notes ?? {}),
        [key]: value,
      },
    })),
    events: [
      ...state.events,
      {
        type: 'player_note_set',
        playerId,
        key,
        value,
      },
    ],
  }
}

export function clearPlayerNote(
  state: EngineState,
  playerId: string,
  key: string,
): EngineState {
  const player = getPlayer(state, playerId)
  if (!player || !(key in (player.notes ?? {}))) {
    return state
  }

  return {
    ...updatePlayer(state, playerId, (currentPlayer) => {
      const nextNotes = { ...(currentPlayer.notes ?? {}) }
      delete nextNotes[key]
      return {
        ...currentPlayer,
        notes: Object.keys(nextNotes).length > 0 ? nextNotes : undefined,
      }
    }),
    events: [
      ...state.events,
      {
        type: 'player_note_cleared',
        playerId,
        key,
      },
    ],
  }
}

export function isPlayerTrulyAlive(player: EnginePlayer): boolean {
  return player.life.projection.trueState === 'alive'
}

export function appearsDeadToTown(player: EnginePlayer): boolean {
  return player.life.projection.publicState === 'dead'
}

export function countsAsAliveForWin(player: EnginePlayer): boolean {
  return player.life.projection.countsAsAliveForWin
}

export function hasStatusEffect(
  state: EngineState,
  playerId: string,
  type: TimedStatusEffect['type'],
): boolean {
  return state.statusEffects.some(
    (effect) => effect.targetPlayerId === playerId && effect.type === type,
  )
}

export function addModifier(
  state: EngineState,
  modifier: DefensiveModifier,
): EngineState {
  return {
    ...state,
    activeModifiers: [...state.activeModifiers, modifier],
  }
}

export function removeModifier(
  state: EngineState,
  modifierId: string,
): EngineState {
  return {
    ...state,
    activeModifiers: state.activeModifiers.filter(
      (modifier) => modifier.id !== modifierId,
    ),
  }
}

export function addAftermathHandler(
  state: EngineState,
  handler: AftermathHandler,
): EngineState {
  return {
    ...state,
    aftermathHandlers: [...state.aftermathHandlers, handler],
  }
}

export function addAbilityOverride(
  state: EngineState,
  override: AbilityOverride,
): EngineState {
  return {
    ...state,
    abilityOverrides: [...state.abilityOverrides, override],
    events: [
      ...state.events,
      {
        type: 'ability_override_added',
        override,
      },
    ],
  }
}

export function removeAbilityOverride(
  state: EngineState,
  overrideId: string,
): EngineState {
  const override = state.abilityOverrides.find((candidate) => candidate.id === overrideId)
  if (!override) {
    return state
  }

  return {
    ...state,
    abilityOverrides: state.abilityOverrides.filter(
      (candidate) => candidate.id !== overrideId,
    ),
    events: [
      ...state.events,
      {
        type: 'ability_override_removed',
        override,
      },
    ],
  }
}

export function addStorytellerNotice(
  state: EngineState,
  notice: StorytellerNotice,
): EngineState {
  return {
    ...state,
    storytellerNotices: [...state.storytellerNotices, notice],
    events: [
      ...state.events,
      {
        type: 'storyteller_notice_added',
        notice,
      },
    ],
  }
}

export function queueInformation(
  state: EngineState,
  packet: InformationPacket,
): EngineState {
  return {
    ...state,
    pendingInformation: [...state.pendingInformation, packet],
    events: [
      ...state.events,
      {
        type: 'information_queued',
        packet,
      },
    ],
  }
}

export function deliverInformation(
  state: EngineState,
  packetId: string,
): EngineState {
  const packet = state.pendingInformation.find((candidate) => candidate.id === packetId)
  if (!packet) {
    return state
  }

  return {
    ...state,
    pendingInformation: state.pendingInformation.filter(
      (candidate) => candidate.id !== packetId,
    ),
    events: [
      ...state.events,
      {
        type: 'information_delivered',
        packet,
      },
    ],
  }
}

export function dismissStorytellerNotice(
  state: EngineState,
  noticeId: string,
): EngineState {
  const notice = state.storytellerNotices.find((candidate) => candidate.id === noticeId)
  if (!notice) {
    return state
  }

  return {
    ...state,
    storytellerNotices: state.storytellerNotices.filter(
      (candidate) => candidate.id !== noticeId,
    ),
    events: [
      ...state.events,
      {
        type: 'storyteller_notice_dismissed',
        notice,
      },
    ],
  }
}

export function resolveGameOutcome(
  state: EngineState,
  input: {
    winner: import('./types').WinningTeam
    title: string
    message: string
    reason: string
    sourcePlayerId?: string
    sourceRoleId?: string
  },
): EngineState {
  return {
    ...state,
    gameOutcome: {
      ended: true,
      winner: input.winner,
      title: input.title,
      reason: input.reason,
      sourcePlayerId: input.sourcePlayerId,
      sourceRoleId: input.sourceRoleId,
    },
    events: [
      ...state.events,
      {
        type: 'game_outcome_resolved',
        winner: input.winner,
        title: input.title,
        message: input.message,
        reason: input.reason,
        sourcePlayerId: input.sourcePlayerId,
        sourceRoleId: input.sourceRoleId,
      },
    ],
  }
}

export function declineGameOutcome(
  state: EngineState,
  input: {
    winner: import('./types').WinningTeam
    title: string
    message: string
    reason: string
    sourcePlayerId?: string
    sourceRoleId?: string
  },
): EngineState {
  return {
    ...state,
    events: [
      ...state.events,
      {
        type: 'game_outcome_declined',
        winner: input.winner,
        title: input.title,
        message: input.message,
        reason: input.reason,
        sourcePlayerId: input.sourcePlayerId,
        sourceRoleId: input.sourceRoleId,
      },
    ],
  }
}

export function requestStorytellerChoice(
  state: EngineState,
  choice: StorytellerChoice,
): EngineState {
  return {
    ...state,
    pendingStorytellerChoices: [...state.pendingStorytellerChoices, choice],
    events: [
      ...state.events,
      {
        type: 'storyteller_choice_requested',
        choice,
      },
    ],
  }
}

export function resolveStorytellerChoice(
  state: EngineState,
  choiceId: string,
  selectedValueId: string,
): EngineState {
  const choice = state.pendingStorytellerChoices.find(
    (candidate) => candidate.id === choiceId,
  )
  if (!choice) {
    return state
  }

  let nextState = {
    ...state,
    pendingStorytellerChoices: state.pendingStorytellerChoices.filter(
      (candidate) => candidate.id !== choiceId,
    ),
    events: [
      ...state.events,
      {
        type: 'storyteller_choice_resolved' as const,
        choice,
        selectedPlayerId: selectedValueId,
      },
    ],
  }

  if (!choice.candidatePlayerIds.includes(selectedValueId)) {
    return state
  }

  for (const action of choice.onResolve ?? []) {
    if (action.kind === 'set_note_value') {
      nextState = updatePlayer(nextState, action.playerId, (player) => ({
        ...player,
        notes: {
          ...(player.notes ?? {}),
          [action.key]: action.value,
        },
      }))
      continue
    }

    if (action.kind === 'set_note_selected_player') {
      nextState = updatePlayer(nextState, action.playerId, (player) => ({
        ...player,
        notes: {
          ...(player.notes ?? {}),
          [action.key]: selectedValueId,
        },
      }))
      continue
    }

    if (action.kind === 'set_note_object_field_to_selected_player') {
      nextState = updatePlayer(nextState, action.playerId, (player) => {
        const existingValue = player.notes?.[action.key]
        const baseObject =
          existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)
            ? (existingValue as Record<string, unknown>)
            : {}

        return {
          ...player,
          notes: {
            ...(player.notes ?? {}),
            [action.key]: {
              ...baseObject,
              [action.field]: selectedValueId,
            },
          },
        }
      })
      continue
    }

    if (action.kind === 'clear_note') {
      nextState = updatePlayer(nextState, action.playerId, (player) => {
        const nextNotes = { ...(player.notes ?? {}) }
        delete nextNotes[action.key]
        return {
          ...player,
          notes: Object.keys(nextNotes).length > 0 ? nextNotes : undefined,
        }
      })
      continue
    }

    if (action.kind === 'apply_status_effect') {
      nextState = action.expiresAt
        ? scheduleStatusEffect(nextState, {
            effect: action.effect,
            scheduledFor: {
              mode: 'phase',
              phase: nextState.phase,
            },
            expiresAt: action.expiresAt,
          })
        : applyStatusEffect(nextState, action.effect)
      continue
    }

    if (action.kind === 'apply_status_effect_to_selected_player') {
      const effect = createTimedStatusEffect({
        ...action.effect,
        targetPlayerId: selectedValueId,
      })
      nextState = action.expiresAt
        ? scheduleStatusEffect(nextState, {
            effect,
            scheduledFor: {
              mode: 'phase',
              phase: nextState.phase,
            },
            expiresAt: action.expiresAt,
          })
        : applyStatusEffect(nextState, effect)
      continue
    }

    if (action.kind === 'queue_information_from_selection') {
      const selectedBoolean = selectedValueId === 'true'
      const parsedNumber = Number(selectedValueId)
      const [selectedFirstRoleId = '', selectedSecondRoleId = ''] =
        selectedValueId.split('|')
      const [selectedFirstPlayerId = '', selectedSecondPlayerId = ''] =
        selectedValueId.split('|')
      const packet = {
        ...action.packet,
        id: `packet-choice-${choiceId}-${selectedValueId}`,
        fragments: action.fragments.map((fragment) => {
          switch (fragment.kind) {
            case 'selected_role':
              return { kind: 'role' as const, roleId: selectedValueId }
            case 'selected_player':
              return { kind: 'player' as const, playerId: selectedValueId }
            case 'selected_boolean':
              return { kind: 'boolean' as const, value: selectedBoolean }
            case 'selected_number':
              return {
                kind: 'number' as const,
                value: Number.isFinite(parsedNumber) ? parsedNumber : 0,
              }
            case 'selected_text':
              return {
                kind: 'text' as const,
                text: choice.candidateLabels?.[selectedValueId] ?? selectedValueId,
              }
            case 'selected_role_pair_first':
              return { kind: 'role' as const, roleId: selectedFirstRoleId }
            case 'selected_role_pair_second':
              return { kind: 'role' as const, roleId: selectedSecondRoleId }
            case 'selected_player_pair_first':
              return { kind: 'player' as const, playerId: selectedFirstPlayerId }
            case 'selected_player_pair_second':
              return { kind: 'player' as const, playerId: selectedSecondPlayerId }
            default:
              return { ...fragment }
          }
        }),
      }
      nextState = queueInformation(nextState, packet)
      continue
    }

    if (action.kind === 'queue_role_signal_decoy_choice') {
      const shownRoleId = selectedValueId
      const actualHolder = findRoleHolder(nextState, shownRoleId)
      if (!actualHolder) {
        continue
      }

      const candidatePlayerIds = nextState.players
        .filter(
          (player) => player.id !== action.infoPlayerId && player.id !== actualHolder.id,
        )
        .map((player) => player.id)

      nextState = requestStorytellerChoice(nextState, {
        id: `${choiceId}:decoy:${shownRoleId}`,
        resolutionMode: 'choice_required',
        kind: 'player_selection',
        title: action.decoyChoiceTitle,
        message: `${action.decoyChoiceMessagePrefix} ${actualHolder.name} for ${shownRoleId}.`,
        sourcePlayerId: action.sourcePlayerId,
        sourceRoleId: action.sourceRoleId,
        candidatePlayerIds,
        candidateLabels: Object.fromEntries(
          candidatePlayerIds.map((playerId) => [
            playerId,
            getPlayer(nextState, playerId)?.name ?? playerId,
          ]),
        ),
        onResolve: [
          {
            kind: 'queue_information_from_selection',
            packet: {
              audience: 'player',
              playerId: action.infoPlayerId,
              title: action.packetTitle,
              summary: `${action.packetSummaryPrefix} ${shownRoleId}.`,
              sourcePlayerId: action.sourcePlayerId,
              sourceRoleId: action.sourceRoleId,
            },
            fragments: [
              { kind: 'text', text: 'One of these players is ' },
              { kind: 'role', roleId: shownRoleId },
              { kind: 'text', text: ': ' },
              { kind: 'player', playerId: actualHolder.id },
              { kind: 'text', text: ' or ' },
              { kind: 'selected_player' },
              { kind: 'text', text: '.' },
            ],
          },
        ],
      })
      continue
    }

    if (action.kind === 'emit_notice_if_selected_player_alignment') {
      const selectedPlayer = getPlayer(nextState, selectedValueId)
      if (!selectedPlayer || !action.alignments.includes(selectedPlayer.alignment)) {
        continue
      }

      nextState = addStorytellerNotice(nextState, {
        id: `notice-choice-${choiceId}-${selectedValueId}-${nextState.storytellerNotices.length}`,
        resolutionMode: 'automatic',
        ...action.notice,
      })
      continue
    }

    if (action.kind === 'propose_game_outcome_if_selected_player_alignment') {
      const selectedPlayer = getPlayer(nextState, selectedValueId)
      if (!selectedPlayer || !action.alignments.includes(selectedPlayer.alignment)) {
        continue
      }

      nextState = requestStorytellerChoice(nextState, {
        id: `${choiceId}:outcome:${selectedValueId}`,
        resolutionMode: 'choice_required',
        kind: 'boolean_selection',
        title: action.title,
        message: action.message,
        sourcePlayerId: action.sourcePlayerId,
        sourceRoleId: action.sourceRoleId,
        candidatePlayerIds: ['true', 'false'],
        candidateLabels: {
          true: 'End game',
          false: 'Continue',
        },
        onResolve: [
          {
            kind: 'resolve_game_outcome',
            winner: action.winner,
            title: action.title,
            message: action.message,
            reason: action.reason,
            sourcePlayerId: action.sourcePlayerId,
            sourceRoleId: action.sourceRoleId,
            confirmValue: 'true',
          },
        ],
      })
      continue
    }

    if (action.kind === 'resolve_game_outcome') {
      if (selectedValueId === (action.confirmValue ?? 'true')) {
        nextState = resolveGameOutcome(nextState, {
          winner: action.winner,
          title: action.title,
          message: action.message,
          reason: action.reason,
          sourcePlayerId: action.sourcePlayerId,
          sourceRoleId: action.sourceRoleId,
        })
      } else {
        nextState = declineGameOutcome(nextState, {
          winner: action.winner,
          title: action.title,
          message: action.message,
          reason: action.reason,
          sourcePlayerId: action.sourcePlayerId,
          sourceRoleId: action.sourceRoleId,
        })
      }
      continue
    }

    if (action.kind === 'resolve_special_execution') {
      if (selectedValueId === (action.confirmValue ?? 'true')) {
        nextState = resolveSpecialExecution(nextState, {
          executedPlayerId: action.executedPlayerId,
          nominationId: action.nominationId ?? null,
          sourcePlayerId: action.sourcePlayerId,
          reason: action.reason,
        })
      }
      continue
    }
  }

  return nextState
}
