import { useMemo } from 'react'
import {
  resolveEvilInfoPlan,
  shouldShowDemonMinionStep,
  shouldShowMinionEvilTeamStep,
} from '../../lib/evilInfo'
import { GameState, PlayerState } from '../../lib/types'
import { getCurrentRole, getCurrentTeam } from '../../lib/identity'
import { useI18n, getRoleName } from '../../lib/i18n'
import { Icon } from '../atoms'

// ============================================================================
// TYPES
// ============================================================================

type EvilTeamRevealProps = {
  /** Current game state */
  state: GameState
  /** The player viewing this screen (excluded from the list) */
  viewer: PlayerState
  /** "demon" shows minions + demon info; "minion" shows other minions + demons */
  viewerType: 'demon' | 'minion'
}

type TeamMember = {
  player: PlayerState
  showRole: boolean
  teamLabel: string
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Shared component for first-night evil team revelation.
 *
 * - When viewerType is "demon": Shows minion players (name only, no role).
 * - When viewerType is "minion": Shows other minions (name only) and demons
 *   (name + role name, since minions learn the Demon's identity).
 */
export function EvilTeamReveal({
  state,
  viewer,
  viewerType,
}: EvilTeamRevealProps) {
  const { t, language } = useI18n()
  const evilInfoPlan = useMemo(() => resolveEvilInfoPlan(state), [state.players])

  const teamMembers: TeamMember[] = useMemo(() => {
    const members: TeamMember[] = []
    const showForViewer =
      viewerType === 'demon'
        ? shouldShowDemonMinionStep(state, evilInfoPlan)
        : shouldShowMinionEvilTeamStep(state, evilInfoPlan)

    if (!showForViewer) {
      return members
    }

    for (const p of state.players) {
      if (p.id === viewer.id) continue
      const role = getCurrentRole(p)
      if (!role) continue

      if (role.team === 'minion' && viewerType === 'demon') {
        members.push({
          player: p,
          showRole: false, // Never show minion roles
          teamLabel: t.teams.minion.name,
        })
      } else if (
        role.team === 'minion' &&
        viewerType === 'minion' &&
        evilInfoPlan.minionsLearnOtherMinions
      ) {
        members.push({
          player: p,
          showRole: false,
          teamLabel: t.teams.minion.name,
        })
      } else if (
        role.team === 'demon' &&
        viewerType === 'minion' &&
        evilInfoPlan.minionsLearnDemon
      ) {
        members.push({
          player: p,
          showRole: true, // Minions learn the Demon role
          teamLabel: t.teams.demon.name,
        })
      }
    }

    // Sort: demons first (when viewer is minion), then minions
    members.sort((a, b) => {
      const aRole = getCurrentRole(a.player)
      const bRole = getCurrentRole(b.player)
      if (aRole?.team === 'demon' && bRole?.team !== 'demon') return -1
      if (aRole?.team !== 'demon' && bRole?.team === 'demon') return 1
      return 0
    })

    return members
  }, [evilInfoPlan, state.players, viewer.id, viewerType, t, language])

  if (teamMembers.length === 0) {
    return (
      <div className='text-center p-4 text-parchment-500'>
        {t.game.noEvilTeammates}
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {teamMembers.map((member) => {
        const role = getCurrentRole(member.player)
        const isDemon = getCurrentTeam(member.player) === 'demon'

        return (
          <div
            key={member.player.id}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              isDemon
                ? 'bg-red-900/30 border border-red-700/40'
                : 'bg-orange-900/20 border border-orange-700/30'
            }`}
          >
            {/* Generic team icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDemon
                  ? 'bg-red-800/40 border border-red-600/30'
                  : 'bg-orange-800/30 border border-orange-600/20'
              }`}
            >
              <Icon
                name={isDemon ? 'flameKindling' : 'swords'}
                size='md'
                className={isDemon ? 'text-red-300' : 'text-orange-300'}
              />
            </div>

            {/* Player info */}
            <div>
              <div className='text-parchment-100 font-medium'>
                {member.player.name}
              </div>
              <div
                className={`text-xs ${isDemon ? 'text-red-400/70' : 'text-orange-400/70'}`}
              >
                {member.showRole && role
                  ? getRoleName(role.id, language)
                  : member.teamLabel}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
