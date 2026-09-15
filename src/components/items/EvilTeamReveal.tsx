import { GameState, PlayerState } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { useI18n } from '../../lib/i18n'
import { Icon } from '../atoms'

// ============================================================================
// TYPES
// ============================================================================

type EvilTeamRevealProps = {
  /** Current game state */
  state: GameState
  /** The player viewing this screen (excluded from the list) */
  viewer: PlayerState
}

export type EvilTeamMember = {
  playerId: string
  playerName: string
  team: 'minion' | 'demon'
}

export function getEvilTeamMembers(
  state: GameState,
  viewer: PlayerState,
): EvilTeamMember[] {
  return state.players
    .filter((player) => player.id !== viewer.id)
    .flatMap((player) => {
      const team = getRole(player.roleId)?.team
      return team === 'minion' || team === 'demon'
        ? [{ playerId: player.id, playerName: player.name, team }]
        : []
    })
    .sort((a, b) => Number(b.team === 'demon') - Number(a.team === 'demon'))
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Shared component for first-night evil team revelation.
 *
 * Evil players learn which players are Minions and Demons, but never their
 * specific characters. The view-model deliberately omits role IDs so the
 * player-facing screen cannot accidentally reveal them.
 */
export function EvilTeamReveal({ state, viewer }: EvilTeamRevealProps) {
  const { t } = useI18n()
  const teamMembers = getEvilTeamMembers(state, viewer)

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
        const isDemon = member.team === 'demon'

        return (
          <div
            key={member.playerId}
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
                {member.playerName}
              </div>
              <div
                className={`text-xs ${isDemon ? 'text-red-400/70' : 'text-orange-400/70'}`}
              >
                {t.teams[member.team].name}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
