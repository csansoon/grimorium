import { EffectDefinition, EffectId, EffectType } from './types'
import type { EffectInstance } from '../types'
import Dead from './definition/dead'
import UsedDeadVote from './definition/used-dead-vote'
import Safe from './definition/safe'
import RedHerring from './definition/red-herring'
import Pure from './definition/pure'
import SlayerBullet from './definition/slayer-bullet'
import Bounce from './definition/bounce'
import Martyrdom from './definition/martyrdom'
import ScarletWoman from './definition/scarlet-woman'
import RecluseMisregister from './definition/recluse-misregister'
import PendingRoleReveal from './definition/pending-role-reveal'
import Poisoned from './definition/poisoned'
import Drunk from './definition/drunk'
import ButlerMaster from './definition/butler-master'
import SpyMisregister from './definition/spy-misregister'

export const EFFECTS: Record<EffectId, EffectDefinition> = {
  dead: Dead,
  used_dead_vote: UsedDeadVote,
  safe: Safe,
  red_herring: RedHerring,
  pure: Pure,
  slayer_bullet: SlayerBullet,
  bounce: Bounce,
  martyrdom: Martyrdom,
  scarlet_woman: ScarletWoman,
  recluse_misregister: RecluseMisregister,
  pending_role_reveal: PendingRoleReveal,
  poisoned: Poisoned,
  drunk: Drunk,
  butler_master: ButlerMaster,
  spy_misregister: SpyMisregister,
}

export function getEffect(effectId: string): EffectDefinition | undefined {
  return EFFECTS[effectId as EffectId]
}

export function getAllEffects(): EffectDefinition[] {
  return Object.values(EFFECTS)
}

/**
 * Check if a player's ability is malfunctioning due to effects
 * like Poisoned or Drunk. Uses the `poisonsAbility` flag on effect definitions.
 */
export function isMalfunctioning(player: {
  effects: Array<{ type: string }>
}): boolean {
  return player.effects.some((e) => {
    const def = EFFECTS[e.type as EffectId]
    return def?.poisonsAbility === true
  })
}

/**
 * Resolves the semantic type of an effect instance for badge styling.
 * Same effect can have different types (e.g. safe from Soldier vs Monk).
 */
export function getEffectType(
  instance: EffectInstance,
  def?: EffectDefinition | null,
): EffectType {
  if (!def) return 'marker'
  if (def.getType) return def.getType(instance)
  return def.defaultType ?? 'marker'
}

/** Badge variant for each effect type (for Badge component). */
export const EFFECT_TYPE_BADGE_VARIANT: Record<
  EffectType,
  `effect_${EffectType}`
> = {
  buff: 'effect_buff',
  nerf: 'effect_nerf',
  marker: 'effect_marker',
  passive: 'effect_passive',
  perception: 'effect_perception',
  pending: 'effect_pending',
}

export * from './types'
