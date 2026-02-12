import { useMemo, useState } from 'react'
import { GameState, PlayerState, hasEffect } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getTeam } from '../../lib/teams'
import { useI18n, getRoleName } from '../../lib/i18n'
import { Icon, Badge, IconName } from '../atoms'
import { PlayerDetailModal } from './PlayerDetailModal'
import { PlayerRoleIcon, filterVisibleEffects } from './PlayerRoleIcon'
import { cn } from '../../lib/utils'
import {
  getEffect,
  getEffectType,
  EFFECT_TYPE_BADGE_VARIANT,
} from '../../lib/effects'

type Props = {
  state: GameState
  compact?: boolean
  /** When provided, tapping a player calls this instead of opening PlayerDetailModal */
  onPlayerSelect?: (player: PlayerState) => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
}

function PlayerRow({
  player,
  onClick,
}: {
  player: PlayerState
  onClick: () => void
}) {
  const role = getRole(player.roleId)
  const team = role ? getTeam(role.team) : null
  const isDead = hasEffect(player, 'dead')

  const { language } = useI18n()

  const roleName = useMemo(() => {
    return getRoleName(player.roleId, language)
  }, [player.roleId, language])

  const effectBadges = useMemo(() => {
    return filterVisibleEffects(player.effects).map((e) => {
      const effect = getEffect(e.type)
      const icon = effect ? effect.icon : 'x'
      const effectType = getEffectType(e, effect)
      const variant = EFFECT_TYPE_BADGE_VARIANT[effectType]
      return { id: e.id, icon: icon as IconName, variant }
    })
  }, [player.effects])

  return (
    <button
      key={player.id}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
        'hover:bg-white/5 active:bg-white/10 active:scale-[0.98]',
        isDead ? 'opacity-60' : '',
      )}
    >
      <PlayerRoleIcon player={player} size='md' />

      {/* Player Info */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <div
            className={cn(
              'font-medium text-sm',
              isDead ? 'text-parchment-500 line-through' : 'text-parchment-100',
            )}
          >
            {player.name}
          </div>
          {effectBadges.map(({ id, icon, variant }) => (
            <Badge key={id} variant={variant} className='px-1.5 py-0.5'>
              <Icon name={icon} size='sm' />
            </Badge>
          ))}
        </div>
        {role && (
          <span className={cn('text-xs', team?.colors.text)}>{roleName}</span>
        )}
      </div>

      {/* Arrow */}
      <Icon name='arrowRight' size='sm' className='text-parchment-500' />
    </button>
  )
}

export function Grimoire({
  state,
  compact = false,
  onPlayerSelect,
  onShowRoleCard,
  onEditEffects,
}: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerState | null>(null)

  const handlePlayerClick = (player: PlayerState) => {
    if (onPlayerSelect) {
      onPlayerSelect(player)
    } else {
      setSelectedPlayer(player)
    }
  }

  return (
    <>
      <div className={cn('space-y-1', compact ? '' : '')}>
        {state.players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            onClick={() => handlePlayerClick(player)}
          />
        ))}
      </div>

      {/* Player Detail Modal — only when not using onPlayerSelect (embedded flow) */}
      {!onPlayerSelect && (
        <PlayerDetailModal
          player={selectedPlayer}
          open={selectedPlayer !== null}
          onClose={() => setSelectedPlayer(null)}
          onShowRoleCard={onShowRoleCard}
          onEditEffects={onEditEffects}
        />
      )}
    </>
  )
}
