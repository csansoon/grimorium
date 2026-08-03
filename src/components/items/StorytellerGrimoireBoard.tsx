import { useMemo } from 'react'
import { GameState, PlayerState, hasEffect } from '../../lib/types'
import { getCurrentRole, getCurrentRoleId, getCurrentTeam } from '../../lib/identity'
import { getTeam } from '../../lib/teams'
import { getRoleName, interpolate, useI18n } from '../../lib/i18n'
import { Button, Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { cn } from '../../lib/utils'
import { getEffect } from '../../lib/effects'
import { filterVisibleEffects } from './PlayerRoleIcon'

type Props = {
  state: GameState
  title?: string
  onPlayerSelect?: (player: PlayerState) => void
  onPlayerSwap?: (sourcePlayerId: string, targetPlayerId: string) => void
  selectedPlayerId?: string | null
  reseatMode?: boolean
  swapSourcePlayerId?: string | null
  onToggleReseatMode?: () => void
  className?: string
}

function getTokenEffectIcons(
  player: PlayerState,
): Array<{ id: string; icon: IconName; className: string }> {
  const result: Array<{ id: string; icon: IconName; className: string }> = []

  if (hasEffect(player, 'drunk')) {
    result.push({
      id: `${player.id}-drunk`,
      icon: 'beer',
      className: 'bg-amber-900/30 border-amber-500/40 text-amber-300',
    })
  }

  const seenTypes = new Set<string>()
  for (const effectInstance of filterVisibleEffects(player.effects)) {
    if (seenTypes.has(effectInstance.type)) continue
    seenTypes.add(effectInstance.type)

    const effect = getEffect(effectInstance.type)
    if (!effect) continue

    result.push({
      id: effectInstance.id,
      icon: effect.icon,
      className: 'bg-cyan-900/25 border-cyan-500/35 text-cyan-300',
    })
  }

  return result
}

export function StorytellerGrimoireBoard({
  state,
  title,
  onPlayerSelect,
  onPlayerSwap,
  selectedPlayerId,
  reseatMode = false,
  swapSourcePlayerId,
  onToggleReseatMode,
  className,
}: Props) {
  const { t, language } = useI18n()
  const boardAspectClass =
    state.players.length > 11
      ? 'aspect-[7/10]'
      : state.players.length > 8
        ? 'aspect-[3/4]'
        : 'aspect-[4/5]'

  const seatPositions = useMemo(() => {
    const playerCount = state.players.length

    return state.players.map((player, index) => {
      const angle = -Math.PI / 2 + (index / playerCount) * Math.PI * 2
      const radius = playerCount >= 13 ? 41 : playerCount >= 10 ? 42 : 43
      const x = 50 + Math.cos(angle) * radius
      const y = 50 + Math.sin(angle) * radius

      return { player, seat: index + 1, x, y }
    })
  }, [state.players])

  return (
    <section
      className={cn(
        'rounded-2xl border border-mystic-gold/20 bg-white/[0.03] backdrop-blur-sm p-4',
        className,
      )}
    >
      {title && (
        <div className='flex items-center gap-3 mb-3'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <Icon name='users' size='sm' className='text-mystic-gold' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              {title}
            </h2>
          </div>
          {onToggleReseatMode && (
            <Button
              onClick={onToggleReseatMode}
              variant={reseatMode ? 'gold' : 'secondary'}
              size='sm'
            >
              <Icon name='gripVertical' size='sm' />
              {reseatMode ? t.game.grimoireReseatDone : t.game.grimoireReseatMode}
            </Button>
          )}
        </div>
      )}

      {reseatMode && (
        <div className='mb-3 rounded-xl border border-mystic-gold/20 bg-mystic-gold/10 px-3 py-2.5'>
          <p className='text-xs text-parchment-300'>
            {swapSourcePlayerId
              ? interpolate(t.game.grimoireSwapPrompt, {
                  player:
                    state.players.find((player) => player.id === swapSourcePlayerId)
                      ?.name ?? t.ui.unknownPlayer,
                })
              : t.game.grimoireReseatHint}
          </p>
        </div>
      )}

      <div className={cn('relative w-full max-w-[26rem] mx-auto', boardAspectClass)}>
        <div className='absolute inset-[11%] rounded-full border border-mystic-gold/20 bg-mystic-gold/5 shadow-[inset_0_0_40px_rgba(255,196,87,0.05)]' />
        <div className='absolute inset-[20%] rounded-full border border-white/8' />
        <div className='absolute inset-[33%] rounded-full border border-mystic-gold/10' />

        {seatPositions.map(({ player, x, y }) => {
          const role = getCurrentRole(player)
          const teamId = getCurrentTeam(player) ?? 'townsfolk'
          const team = getTeam(teamId)
          const isSelected = player.id === selectedPlayerId
          const isDead = hasEffect(player, 'dead')
          const effectIcons = getTokenEffectIcons(player)

          return (
            <button
              key={player.id}
              onClick={() => {
                if (reseatMode) {
                  if (swapSourcePlayerId && swapSourcePlayerId !== player.id) {
                    onPlayerSwap?.(swapSourcePlayerId, player.id)
                    return
                  }
                  onPlayerSelect?.(player)
                  return
                }
                onPlayerSelect?.(player)
              }}
              className='absolute -translate-x-1/2 -translate-y-1/2 w-[5.35rem]'
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={cn(
                  'relative flex flex-col items-center rounded-2xl px-1 py-1.5 transition-all',
                  isDead && 'opacity-70',
                  (isSelected || swapSourcePlayerId === player.id) &&
                    'bg-mystic-gold/8 shadow-[0_0_0_1px_rgba(255,196,87,0.25),0_0_16px_rgba(255,196,87,0.15)]',
                )}
              >
                <div
                  className={cn(
                    'relative w-[4.8rem] h-[4.8rem] rounded-full overflow-visible',
                    isSelected && 'scale-[1.03]',
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 rounded-full border bg-black/20',
                      isDead
                        ? 'border-parchment-500/20'
                        : 'border-white/10',
                    )}
                  />
                  <div
                    className={cn(
                      'absolute inset-[6px] rounded-full border',
                      isDead ? 'border-parchment-500/20' : team.colors.cardSealRing,
                    )}
                  />
                  <div
                    className={cn(
                      'absolute inset-[11px] rounded-full flex items-center justify-center border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                      isDead
                        ? 'bg-parchment-500/10 border-parchment-500/25'
                        : team.colors.cardIconBg,
                    )}
                  >
                    {role && (
                      <Icon
                        name={role.icon}
                        size='xl'
                        className={
                          isDead ? 'text-parchment-500' : team.colors.cardWinAccent
                        }
                      />
                    )}
                  </div>

                  {isDead && (
                    <div
                      className='absolute left-1/2 -translate-x-1/2 -top-2 w-6 h-14 bg-grimoire-dark/95 border border-parchment-500/25 shadow-sm flex items-center justify-center'
                      style={{
                        clipPath:
                          'polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%)',
                      }}
                    >
                      <Icon
                        name='skull'
                        size='xs'
                        className='text-parchment-400'
                      />
                    </div>
                  )}

                  {effectIcons.length > 0 && (
                    <div className='absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1'>
                      {effectIcons.slice(0, 4).map((effectIcon) => (
                        <div
                          key={effectIcon.id}
                          className={cn(
                            'w-5 h-5 rounded-full border flex items-center justify-center shadow-sm backdrop-blur-sm',
                            effectIcon.className,
                          )}
                        >
                          <Icon
                            name={effectIcon.icon}
                            size='xs'
                            className='shrink-0'
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className='mt-1 text-[10px] leading-tight text-center text-parchment-100 max-w-[5rem]'>
                  <div
                    className={cn(
                      'font-medium uppercase tracking-[0.12em] text-[9px] truncate',
                      isDead ? 'text-parchment-500' : 'text-mystic-gold',
                    )}
                  >
                    {getRoleName(getCurrentRoleId(player), language)}
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 truncate',
                      isDead
                        ? 'text-parchment-500 line-through'
                        : 'text-parchment-300',
                    )}
                  >
                    {player.name}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
