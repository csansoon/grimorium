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
  | 'bounce'
  | 'martyrdom'
  | 'scarlet_woman'
  | 'recluse_misregister'
  | 'pending_role_reveal'
  | 'poisoned'
  | 'drunk'
  | 'butler_master'
  | 'spy_misregister'

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
}
