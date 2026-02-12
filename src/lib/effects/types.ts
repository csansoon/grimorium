import { FC } from 'react'
import { IconName } from '../../components/atoms/icon'
import { EffectInstance, GameState, PlayerState } from '../types'
import { TeamId } from '../teams'
import {
  IntentHandler,
  DayActionDefinition,
  NightFollowUpDefinition,
  WinConditionCheck,
  PerceptionModifier,
} from '../pipeline/types'

export type EffectId =
  | 'dead'
  | 'used_dead_vote'
  | 'safe'
  | 'red_herring'
  | 'pure'
  | 'slayer_bullet'
  | 'deflect'
  | 'martyrdom'
  | 'demon_successor'
  | 'misregister'
  | 'pending_role_reveal'
  | 'poisoned'
  | 'drunk'
  | 'butler_master'

/**
 * Semantic type of an effect for badge styling.
 * Generic categories: why it's there + valence (buff/nerf/neutral).
 * - buff: helps the player (protection, ability)
 * - nerf: hurts the player (death, malfunction)
 * - marker: informational only, no mechanical impact
 * - passive: reactive, triggers on events
 * - perception: affects how info roles see you
 * - pending: workflow, awaiting narrator action
 */
export type EffectType =
  | 'buff'
  | 'nerf'
  | 'marker'
  | 'passive'
  | 'perception'
  | 'pending'

export type EffectDefinition = {
  id: EffectId
  icon: IconName

  // Behavior modifiers
  preventsNightWake?: boolean
  preventsVoting?: boolean
  preventsNomination?: boolean

  // Whether this effect causes the player's ability to malfunction
  // (e.g., Poisoned, Drunk — info roles give wrong info, passive abilities fail)
  poisonsAbility?: boolean

  // Check if a player can vote given this effect
  canVote?: (player: PlayerState, state: GameState) => boolean

  // Check if a player can nominate given this effect
  canNominate?: (player: PlayerState, state: GameState) => boolean

  // Pipeline intent handlers — intercept/modify/prevent intents
  handlers?: IntentHandler[]

  // Day actions this effect enables (shown as buttons on the day phase)
  dayActions?: DayActionDefinition[]

  // Night follow-ups this effect enables (shown as items in the Night Dashboard)
  // Used for reactive behaviors like role change reveals
  nightFollowUps?: NightFollowUpDefinition[]

  // Win conditions this effect contributes
  winConditions?: WinConditionCheck[]

  // Perception modifiers — alter how the player carrying this effect
  // is perceived by information roles (e.g., Recluse, Spy)
  perceptionModifiers?: PerceptionModifier[]

  // Declares that a player with this effect could register as these teams
  // and/or alignments. Used by narrator-setup UIs (e.g. Investigator) to
  // allow these players as valid picks even when perceiveAs isn't configured.
  //
  // Can also be provided per-instance via `EffectInstance.data.canRegisterAs`.
  // Instance data takes precedence over the definition value. This allows
  // a single generic effect (e.g., `misregister`) to be configured differently
  // for different roles (Recluse vs Spy).
  canRegisterAs?: {
    teams?: TeamId[]
    alignments?: ('good' | 'evil')[]
  }

  /**
   * Semantic type for badge styling. Generic: buff/nerf/marker/passive/perception/pending.
   */
  defaultType?: EffectType

  /**
   * Resolves the semantic type for a specific effect instance.
   * Use when the same effect can have different types based on context.
   */
  getType?: (instance: EffectInstance) => EffectType

  /**
   * Custom description component for this effect.
   * When provided, `PlayerDetailModal` renders this instead of the static i18n
   * description string. This allows rich rendering with Badges for teams,
   * alignments, roles, etc. — matching the quality of history RichMessages.
   *
   * Falls back to the static i18n description when not provided.
   */
  Description?: FC<EffectDescriptionProps>

  /**
   * Optional configuration editor for this effect.
   * When provided, the EditEffectsModal will show this component when:
   * - Adding a new instance of this effect (data is undefined)
   * - Editing an existing instance (data is the current instance data)
   *
   * Effects without a ConfigEditor are added/removed with no configuration.
   */
  ConfigEditor?: FC<EffectConfigEditorProps>
}

export type EffectDescriptionProps = {
  /** The effect instance with its data */
  instance: EffectInstance
  /** Current language code */
  language: string
}

/**
 * Props for an effect's configuration editor.
 * Rendered inside `EditEffectsModal` when adding a new effect that needs
 * configuration, or when editing an existing effect's data.
 */
export type EffectConfigEditorProps = {
  /** Current data (undefined when creating a new effect, populated when editing) */
  data: Record<string, unknown> | undefined
  /** Current game state — for player lists, role lists, etc. */
  state: GameState
  /** The player this effect is being added to / edited on */
  playerId: string
  /** Current language code */
  language: string
  /** Called when the narrator confirms the configuration */
  onSave: (data: Record<string, unknown>) => void
  /** Called when the narrator cancels */
  onCancel: () => void
}
