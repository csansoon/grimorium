import { PlayerState, hasEffect } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getTeam, TeamId } from '../../lib/teams'
import {
  getEffect,
  getEffectType,
  EFFECT_TYPE_BADGE_VARIANT,
} from '../../lib/effects'
import {
  useI18n,
  getRoleName as getRegistryRoleName,
  getRoleDescription as getRegistryRoleDescription,
  getEffectName as getRegistryEffectName,
  getEffectDescription as getRegistryEffectDescription,
} from '../../lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  Icon,
  Badge,
  Button,
} from '../atoms'
import { PlayerRoleIcon, filterVisibleEffects } from './PlayerRoleIcon'
import { cn } from '../../lib/utils'

type Props = {
  player: PlayerState | null
  open: boolean
  onClose: () => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
}

export function PlayerDetailModal({
  player,
  open,
  onClose,
  onShowRoleCard,
  onEditEffects,
}: Props) {
  const { t, language } = useI18n()

  if (!player) return null

  const role = getRole(player.roleId)
  const team = role ? getTeam(role.team) : null
  const isDead = hasEffect(player, 'dead')
  const isDrunk = hasEffect(player, 'drunk')
  const isEvil = team?.isEvil ?? false

  const teamId = role?.team as TeamId | undefined

  const roleName = role ? getRegistryRoleName(role.id, language) : 'Unknown'
  const roleDescription = role
    ? getRegistryRoleDescription(role.id, language)
    : ''
  const teamName = teamId ? t.teams[teamId]?.name : ''
  const winCondition = teamId ? t.teams[teamId]?.winCondition : ''

  const getEffectName = (effectType: string) =>
    getRegistryEffectName(effectType, language)

  const getEffectDescription = (effectType: string) =>
    getRegistryEffectDescription(effectType, language)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          {/* Player status indicator */}
          <div className='flex justify-center mb-4'>
            <PlayerRoleIcon
              player={player}
              size='lg'
              iconClassName={isEvil ? 'text-red-400' : 'text-mystic-gold'}
            />
          </div>

          {/* Player Name */}
          <DialogTitle>{player.name}</DialogTitle>

          {/* Status badges */}
          <div className='flex justify-center gap-2 mt-2'>
            {isDead && (
              <Badge variant='dead'>
                <Icon name='skull' size='xs' className='mr-1' />
                {getEffectName('dead')}
              </Badge>
            )}
            {isDrunk && (
              <Badge variant='outsider'>
                <Icon name='beer' size='xs' className='mr-1' />
                {getEffectName('drunk')}
              </Badge>
            )}
            {role && (
              <Badge variant={role.team}>
                <Icon name={role.icon} size='xs' className='mr-1' />
                {roleName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Role Section */}
          {role && (
            <div className='mb-6'>
              <div className='flex items-center gap-2 mb-2'>
                <Icon
                  name={role.icon}
                  size='sm'
                  className={team?.colors.text}
                />
                <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
                  {t.common.role}
                </span>
                <span className='text-xs text-parchment-500'>({teamName})</span>
              </div>
              <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
                <p className='text-parchment-200 text-sm leading-relaxed'>
                  {roleDescription}
                </p>
              </div>
            </div>
          )}

          {/* Effects Section (dead and drunk are shown via custom UI above) */}
          {filterVisibleEffects(player.effects).length > 0 && (
            <div className='mb-6'>
              <div className='flex items-center gap-2 mb-2'>
                <Icon name='sparkles' size='sm' className='text-cyan-400' />
                <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
                  {t.ui.effects}
                </span>
              </div>
              <div className='space-y-2'>
                {filterVisibleEffects(player.effects).map(
                  (effectInstance, index) => {
                    const effect = getEffect(effectInstance.type)
                    const effectName = getEffectName(effectInstance.type)
                    const effectDescription = getEffectDescription(
                      effectInstance.type,
                    )
                    const effectType = getEffectType(effectInstance, effect)
                    const badgeVariant = EFFECT_TYPE_BADGE_VARIANT[effectType]
                    const DescriptionComponent = effect?.Description

                    return (
                      <div
                        key={`${effectInstance.type}-${index}`}
                        className='bg-white/5 rounded-lg p-3 border border-white/10'
                      >
                        <div className='flex items-center gap-2'>
                          {effect && (
                            <Badge variant={badgeVariant}>
                              <Icon name={effect.icon} size='xs' />
                            </Badge>
                          )}
                          <span className='text-parchment-400 text-xs font-bold'>
                            {effectName}
                          </span>
                        </div>
                        {DescriptionComponent ? (
                          <div className='text-parchment-400 text-xs mt-2 leading-relaxed'>
                            <DescriptionComponent
                              instance={effectInstance}
                              language={language}
                            />
                          </div>
                        ) : (
                          effectDescription && (
                            <p className='text-parchment-400 text-xs mt-2'>
                              {effectDescription}
                            </p>
                          )
                        )}
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          )}

          {/* Win Condition */}
          {winCondition && (
            <div className='mb-6'>
              <div className='flex items-center gap-2 mb-2'>
                <Icon
                  name='trophy'
                  size='sm'
                  className={isEvil ? 'text-red-400' : 'text-mystic-gold'}
                />
                <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
                  {t.common.winCondition}
                </span>
              </div>
              <div
                className={cn(
                  'rounded-lg p-4 border',
                  isEvil
                    ? 'bg-red-950/30 border-red-600/30'
                    : 'bg-mystic-gold/5 border-mystic-gold/20',
                )}
              >
                <p className='text-parchment-300 text-sm leading-relaxed'>
                  {winCondition}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-2'>
            {/* See Role Card Button */}
            {role && onShowRoleCard && (
              <Button
                onClick={() => {
                  onClose()
                  onShowRoleCard(player)
                }}
                fullWidth
                variant='outline'
                className='border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/10'
              >
                <Icon name='eye' size='md' className='mr-2' />
                {t.ui.seeRoleCard}
              </Button>
            )}

            {/* Edit Effects Button */}
            {onEditEffects && (
              <Button
                onClick={() => {
                  onClose()
                  onEditEffects(player)
                }}
                fullWidth
                variant='outline'
                className='border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20'
              >
                <Icon name='sparkles' size='md' className='mr-2' />
                {t.ui.editEffects}
              </Button>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
