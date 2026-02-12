import { GameState, PlayerState, EffectInstance } from '../types'
import { getRole } from '../roles/index'
import { getEffect, resolveCanRegisterAs } from '../effects'
import { isEvilTeam, TeamId } from '../teams'
import { Perception, PerceptionContext } from './types'

/**
 * Determine how a target player is perceived by an observer player.
 *
 * Starts with the target's actual role/team/alignment, then applies
 * any perception modifiers from the target's active effects.
 *
 * This is the core abstraction that decouples information-gathering roles
 * from roles that alter their own perception (Recluse, Spy, etc.).
 *
 * @param targetPlayer  - The player being observed
 * @param observerPlayer - The player whose information ability is querying
 * @param context - What aspect is being queried: "alignment", "team", or "role"
 * @param state - Current game state
 * @returns The (possibly modified) perception of the target player
 */
export function perceive(
  targetPlayer: PlayerState,
  observerPlayer: PlayerState,
  context: PerceptionContext,
  state: GameState,
): Perception {
  const role = getRole(targetPlayer.roleId)
  const team = role?.team ?? 'townsfolk'

  let perception: Perception = {
    roleId: targetPlayer.roleId,
    team,
    alignment: isEvilTeam(team) ? 'evil' : 'good',
  }

  // Collect and apply perception modifiers from the target's effects
  for (const effectInstance of targetPlayer.effects) {
    const effectDef = getEffect(effectInstance.type)
    if (!effectDef?.perceptionModifiers) continue

    for (const modifier of effectDef.perceptionModifiers) {
      // Check if this modifier applies to the current context
      const contexts = Array.isArray(modifier.context)
        ? modifier.context
        : [modifier.context]
      if (!contexts.includes(context)) continue

      // Check if this modifier is restricted to specific observer roles
      if (modifier.observerRoles) {
        if (!modifier.observerRoles.includes(observerPlayer.roleId)) continue
      }

      // Apply the modification
      perception = modifier.modify(
        perception,
        targetPlayer,
        observerPlayer,
        state,
        effectInstance.data,
      )
    }
  }

  return perception
}

/**
 * Check whether a player could potentially register as a given team.
 *
 * Returns true if the player has any active effect whose `canRegisterAs.teams`
 * includes the target team. This is used by narrator-setup UIs (e.g., Investigator)
 * to allow players with misregistration effects (e.g., Recluse) as valid picks
 * without requiring the narrator to pre-configure the effect's perceiveAs data.
 *
 * This does NOT check the player's actual team or current perception — use
 * `perceive()` for that. This only checks static declarations on effects.
 */
export function canRegisterAsTeam(player: PlayerState, team: TeamId): boolean {
  for (const effectInstance of player.effects) {
    const effectDef = getEffect(effectInstance.type)
    const canRegisterAs = resolveCanRegisterAs(effectInstance, effectDef)
    if (canRegisterAs?.teams?.includes(team)) return true
  }
  return false
}

/**
 * Check whether a player could potentially register as a given alignment.
 *
 * Companion to `canRegisterAsTeam()`. Returns true if the player has any
 * active effect whose `canRegisterAs.alignments` includes the target alignment.
 *
 * Used by auto-calculating roles (Chef, Empath) to detect ambiguous players
 * that need narrator configuration before calculating results.
 */
export function canRegisterAsAlignment(
  player: PlayerState,
  alignment: 'good' | 'evil',
): boolean {
  for (const effectInstance of player.effects) {
    const effectDef = getEffect(effectInstance.type)
    const canRegisterAs = resolveCanRegisterAs(effectInstance, effectDef)
    if (canRegisterAs?.alignments?.includes(alignment)) return true
  }
  return false
}

/**
 * Get players whose perception is ambiguous for a given context.
 *
 * Returns players that have effects declaring `canRegisterAs` for the given
 * perception context. This is used by night action components to determine
 * whether a perception configuration step is needed — without referencing
 * any specific role or effect.
 *
 * - "alignment" context: checks `canRegisterAs.alignments`
 * - "team" context: checks `canRegisterAs.teams`
 * - "role" context: checks both (misregistration at any level affects role perception)
 */
export function getAmbiguousPlayers(
  players: PlayerState[],
  context: PerceptionContext,
): PlayerState[] {
  return players.filter((player) => {
    for (const effectInstance of player.effects) {
      const effectDef = getEffect(effectInstance.type)
      const canRegisterAs = resolveCanRegisterAs(effectInstance, effectDef)
      if (!canRegisterAs) continue
      if (context === 'alignment' && canRegisterAs.alignments?.length)
        return true
      if (context === 'team' && canRegisterAs.teams?.length) return true
      if (
        context === 'role' &&
        (canRegisterAs.teams?.length || canRegisterAs.alignments?.length)
      )
        return true
    }
    return false
  })
}

/**
 * Create a local copy of GameState with perception overrides applied.
 *
 * For each player in `overrides`, finds their effects that have `canRegisterAs`
 * and injects `perceiveAs` data into the effect instance. This way, when
 * `perceive()` is called on the returned state, the existing perception
 * modifier on the effect (which reads `effectData?.perceiveAs`) will use
 * the narrator's chosen overrides.
 *
 * This is used locally within NightAction components — no game events are emitted.
 * The overrides are ephemeral and only affect the current calculation.
 */
export function applyPerceptionOverrides(
  state: GameState,
  overrides: Record<string, Partial<Perception>>,
): GameState {
  if (Object.keys(overrides).length === 0) return state

  return {
    ...state,
    players: state.players.map((player) => {
      const override = overrides[player.id]
      if (!override) return player

      // Find effects that declare canRegisterAs (on definition or instance)
      // and inject perceiveAs data
      const updatedEffects: EffectInstance[] = player.effects.map(
        (effectInstance) => {
          const effectDef = getEffect(effectInstance.type)
          const canRegisterAs = resolveCanRegisterAs(effectInstance, effectDef)
          if (!canRegisterAs) return effectInstance

          return {
            ...effectInstance,
            data: {
              ...effectInstance.data,
              perceiveAs: override,
            },
          }
        },
      )

      return { ...player, effects: updatedEffects }
    }),
  }
}
