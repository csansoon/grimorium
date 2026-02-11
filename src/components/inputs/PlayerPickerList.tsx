import { useMemo } from 'react'
import { PlayerState, hasEffect } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getTeam } from '../../lib/teams'
import { getEffect } from '../../lib/effects'
import { useI18n, getRoleName as getRegistryRoleName } from '../../lib/i18n'
import { Icon } from '../atoms'
import { IconName } from '../atoms/icon'
import { PlayerRoleIcon, filterVisibleEffects } from '../items/PlayerRoleIcon'
import { cn } from '../../lib/utils'

type PlayerPickerListProps = {
  /** Players available for selection. Pre-filtered by the caller. */
  players: PlayerState[]

  /** Currently selected player ID(s). */
  selected: string[]

  /** Called when a player is tapped. */
  onSelect: (playerId: string) => void

  /**
   * How many players must/can be selected.
   * - A number (e.g. 1, 2) caps selection at that count.
   *   When exactly 1, tapping a new item replaces the previous selection (radio behavior).
   *   When > 1, tapping toggles (checkbox behavior, capped at max).
   * - `null` means free selection (any number).
   */
  selectionCount?: number | null

  /**
   * Color variant for the selection highlight.
   * - "blue" (default): good/neutral actions (info roles, Monk, Butler)
   * - "red": evil/aggressive actions (Imp kill, nominations, Slayer)
   */
  variant?: 'red' | 'blue'
}

const variantStyles = {
  red: {
    selected: 'bg-red-900/40 border-red-500/50',
    selectedAccent: 'text-red-400',
    glow: '0 0 12px rgba(200, 0, 0, 0.25)',
  },
  blue: {
    selected: 'bg-blue-900/40 border-blue-500/50',
    selectedAccent: 'text-blue-300',
    glow: '0 0 12px rgba(60, 130, 246, 0.2)',
  },
}

export function PlayerPickerList({
  players,
  selected,
  onSelect,
  selectionCount = 1,
  variant = 'blue',
}: PlayerPickerListProps) {
  const { t, language } = useI18n()
  const styles = variantStyles[variant]

  const isAtMax =
    selectionCount !== null &&
    selectionCount !== undefined &&
    selected.length >= selectionCount

  const getRoleName = (roleId: string) => getRegistryRoleName(roleId, language)

  return (
    <div className='space-y-1.5'>
      {players.map((player) => {
        const isSelected = selected.includes(player.id)
        // When selectionCount === 1, allow tapping a different item to replace (radio behavior)
        const isDisabled = !isSelected && isAtMax && selectionCount !== 1
        const role = getRole(player.roleId)
        const team = role ? getTeam(role.team) : null
        const isDead = hasEffect(player, 'dead')

        return (
          <button
            key={player.id}
            type='button'
            disabled={isDisabled}
            onClick={() => onSelect(player.id)}
            className={cn(
              'w-full rounded-xl border-2 px-3 py-2.5 transition-all flex items-center gap-3',
              isSelected
                ? styles.selected
                : 'border-white/10 bg-white/5 hover:bg-white/[0.08]',
              isDisabled && 'opacity-40 cursor-not-allowed',
              isDead && !isSelected && 'opacity-60',
            )}
            style={isSelected ? { boxShadow: styles.glow } : undefined}
          >
            <PlayerRoleIcon
              player={player}
              size='sm'
              circleClassName={
                isSelected && team
                  ? team.colors.cardIconBg
                  : 'bg-white/5 border border-white/10'
              }
              iconClassName={
                isSelected && team ? team.colors.text : 'text-parchment-500'
              }
            />

            {/* Player info */}
            <div className='flex-1 min-w-0 text-left'>
              {/* Name */}
              <span
                className={cn(
                  'text-sm font-medium truncate block',
                  isDead
                    ? 'text-parchment-500 line-through'
                    : isSelected
                      ? 'text-parchment-100'
                      : 'text-parchment-200',
                )}
              >
                {player.name}
              </span>

              {/* Role + alignment + effect icons */}
              <div className='flex items-center gap-1.5 mt-0.5'>
                {role && team && (
                  <>
                    <span className={cn('text-[11px]', team.colors.text)}>
                      {getRoleName(role.id)}
                    </span>
                    <span className='text-parchment-600'>&middot;</span>
                    <span
                      className={cn(
                        'text-[11px]',
                        team.isEvil ? 'text-red-400/70' : 'text-blue-300/70',
                      )}
                    >
                      {team.isEvil ? t.game.registerAsEvil : t.game.registerAsGood}
                    </span>
                  </>
                )}

                {/* Effect icons */}
                <EffectIcons player={player} />
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                  variant === 'red' ? 'bg-red-500/20' : 'bg-blue-500/20',
                )}
              >
                <Icon
                  name='check'
                  size='xs'
                  className={styles.selectedAccent}
                />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// EFFECT ICONS (inline)
// ============================================================================

function EffectIcons({ player }: { player: PlayerState }) {
  const effectIcons = useMemo(() => {
    return filterVisibleEffects(player.effects)
      .map((e) => {
        const def = getEffect(e.type)
        return def ? { id: e.type, icon: def.icon as IconName } : null
      })
      .filter((e): e is { id: string; icon: IconName } => e !== null)
  }, [player.effects])

  if (effectIcons.length === 0) return null

  return (
    <div className='flex items-center gap-0.5 ml-auto flex-shrink-0'>
      {effectIcons.map((e) => (
        <Icon
          key={e.id}
          name={e.icon}
          size='xs'
          className='text-parchment-600'
        />
      ))}
    </div>
  )
}
