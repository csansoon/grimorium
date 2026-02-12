import { useState, useCallback, useEffect } from 'react'
import {
  GameState,
  PlayerState,
  hasEffect,
  EffectInstance,
  getPlayer,
} from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getTeam, TeamId } from '../../lib/teams'
import {
  getEffect,
  getAllEffects,
  getEffectType,
  EFFECT_TYPE_BADGE_VARIANT,
} from '../../lib/effects'
import { EffectDefinition } from '../../lib/effects/types'
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
import { BackButton } from '../atoms'
import { Grimoire } from './Grimoire'
import { PlayerRoleIcon, filterVisibleEffects } from './PlayerRoleIcon'
import { cn } from '../../lib/utils'

type GrimoireView =
  | { type: 'list' }
  | { type: 'player_detail'; player: PlayerState }
  | { type: 'edit_effects'; player: PlayerState }
  | {
      type: 'effect_config'
      player: PlayerState
      effectDef: EffectDefinition
      mode: 'add' | 'edit'
      effectInstance?: EffectInstance
    }

export type GrimoireIntent =
  | { view: 'list'; readOnly?: boolean }
  | { view: 'player_detail'; player: PlayerState; readOnly?: boolean }
  | { view: 'edit_effects'; player: PlayerState }

type Props = {
  state: GameState
  open: boolean
  onClose: () => void
  intent?: GrimoireIntent
  onShowRoleCard?: (player: PlayerState) => void
  onAddEffect: (
    playerId: string,
    effectType: string,
    data?: Record<string, unknown>,
  ) => void
  onRemoveEffect: (playerId: string, effectType: string) => void
  onUpdateEffect: (
    playerId: string,
    effectType: string,
    data: Record<string, unknown>,
  ) => void
}

export function GrimoireModal({
  state,
  open,
  onClose,
  intent = { view: 'list' },
  onShowRoleCard,
  onAddEffect,
  onRemoveEffect,
  onUpdateEffect,
}: Props) {
  const { t, language } = useI18n()
  const [view, setView] = useState<GrimoireView>(() => {
    if (intent.view === 'edit_effects') {
      return { type: 'edit_effects', player: intent.player }
    }
    return { type: 'list' }
  })

  // Sync view when modal first opens (respect initial intent)
  useEffect(() => {
    if (!open) return
    if (intent.view === 'edit_effects') {
      const latestPlayer = state.players.find((p) => p.id === intent.player.id)
      setView({
        type: 'edit_effects',
        player: latestPlayer ?? intent.player,
      })
    } else if (intent.view === 'player_detail') {
      const latestPlayer = state.players.find((p) => p.id === intent.player.id)
      setView({
        type: 'player_detail',
        player: latestPlayer ?? intent.player,
      })
    } else {
      setView({ type: 'list' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync on open
  }, [open])

  const resetView = useCallback(() => setView({ type: 'list' }), [])

  const handleClose = useCallback(() => {
    resetView()
    onClose()
  }, [onClose, resetView])

  const goBack = useCallback(() => {
    if (view.type === 'list') {
      handleClose()
    } else if (view.type === 'player_detail') {
      setView({ type: 'list' })
    } else if (view.type === 'edit_effects') {
      setView({ type: 'player_detail', player: view.player })
    } else if (view.type === 'effect_config') {
      setView({ type: 'edit_effects', player: view.player })
    }
  }, [view, handleClose])

  const handlePlayerSelect = useCallback((player: PlayerState) => {
    setView({ type: 'player_detail', player })
  }, [])

  const handleEditEffects = useCallback((player: PlayerState) => {
    setView({ type: 'edit_effects', player })
  }, [])

  const getEffectName = (effectType: string) =>
    getRegistryEffectName(effectType, language)

  const getHeaderTitle = () => {
    switch (view.type) {
      case 'list':
        return t.game.grimoire
      case 'player_detail':
        return view.player.name
      case 'edit_effects':
        return t.ui.editEffects
      case 'effect_config':
        return view.mode === 'add'
          ? t.ui.addEffect
          : t.ui.editEffectConfig
    }
  }

  // No back button when opening directly to a player (from inline Grimoire or Spy)
  const isDirectPlayerOpen =
    intent.view === 'player_detail' && view.type === 'player_detail'
  const showBackButton = view.type !== 'list' && !isDirectPlayerOpen

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className='max-h-[90vh]'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            {showBackButton && (
              <BackButton onClick={goBack} label={t.common.back} />
            )}
            <div className='flex-1 flex items-center justify-center gap-2'>
              {view.type === 'list' && (
                <Icon name='bookUser' size='md' className='text-mystic-gold' />
              )}
              <DialogTitle className={showBackButton ? 'text-left' : ''}>
                {getHeaderTitle()}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <DialogBody>
          {view.type === 'list' && (
            <Grimoire
              state={state}
              onPlayerSelect={handlePlayerSelect}
              onShowRoleCard={(player) => {
                handleClose()
                onShowRoleCard?.(player)
              }}
              onEditEffects={handleEditEffects}
            />
          )}

          {view.type === 'player_detail' && (
            <PlayerDetailContent
              player={view.player}
              showEditEffects={
                !('readOnly' in intent && intent.readOnly === true)
              }
              onShowRoleCard={() => {
                handleClose()
                onShowRoleCard?.(view.player)
              }}
              onEditEffects={() => handleEditEffects(view.player)}
            />
          )}

          {view.type === 'edit_effects' && (
            <EditEffectsContent
              player={getPlayer(state, view.player.id) ?? view.player}
              onAddEffect={onAddEffect}
              onRemoveEffect={onRemoveEffect}
              onBack={() =>
                setView({ type: 'player_detail', player: view.player })
              }
              onOpenConfig={(effectDef, mode, effectInstance) =>
                setView({
                  type: 'effect_config',
                  player: view.player,
                  effectDef,
                  mode,
                  effectInstance,
                })
              }
            />
          )}

          {view.type === 'effect_config' && (
            <EffectConfigContent
              player={getPlayer(state, view.player.id) ?? view.player}
              state={state}
              effectDef={view.effectDef}
              effectInstance={view.effectInstance}
              effectName={getEffectName(view.effectDef.id)}
              onSave={(data) => {
                if (view.mode === 'add') {
                  onAddEffect(view.player.id, view.effectDef.id, data)
                } else if (view.effectInstance) {
                  onUpdateEffect(view.player.id, view.effectInstance.type, data)
                }
                setView({ type: 'edit_effects', player: view.player })
              }}
              onCancel={() =>
                setView({ type: 'edit_effects', player: view.player })
              }
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

// ─── Player Detail Content (no Dialog wrapper) ─────────────────────────────

function PlayerDetailContent({
  player,
  showEditEffects = true,
  onShowRoleCard,
  onEditEffects,
}: {
  player: PlayerState
  showEditEffects?: boolean
  onShowRoleCard: () => void
  onEditEffects: () => void
}) {
  const { t, language } = useI18n()
  const role = getRole(player.roleId)
  const team = role ? getTeam(role.team) : null
  const isDead = hasEffect(player, 'dead')
  const isDrunk = hasEffect(player, 'drunk')
  const isEvil = team?.isEvil ?? false

  const teamId = role?.team as TeamId | undefined
  const roleName = role ? getRegistryRoleName(role.id, language) : t.ui.unknown
  const roleDescription = role
    ? getRegistryRoleDescription(role.id, language)
    : ''
  const teamName = teamId ? t.teams[teamId]?.name : ''
  const winCondition = teamId ? t.teams[teamId]?.winCondition : ''
  const getEffectName = (effectType: string) =>
    getRegistryEffectName(effectType, language)

  return (
    <div className='space-y-6'>
      <div className='flex justify-center'>
        <PlayerRoleIcon
          player={player}
          size='lg'
          iconClassName={isEvil ? 'text-red-400' : 'text-mystic-gold'}
        />
      </div>

      <div className='flex justify-center gap-2'>
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

      {role && (
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <Icon name={role.icon} size='sm' className={team?.colors.text} />
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

      {filterVisibleEffects(player.effects).length > 0 && (
        <div>
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
                      <p className='text-parchment-400 text-xs mt-2'>
                        {getRegistryEffectDescription(
                          effectInstance.type,
                          language,
                        )}
                      </p>
                    )}
                  </div>
                )
              },
            )}
          </div>
        </div>
      )}

      {winCondition && (
        <div>
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

      <div className='space-y-2'>
        {role && onShowRoleCard && (
          <Button
            onClick={onShowRoleCard}
            fullWidth
            variant='outline'
            className='border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/10'
          >
            <Icon name='eye' size='md' className='mr-2' />
            {t.ui.seeRoleCard}
          </Button>
        )}
        {showEditEffects && (
          <Button
            onClick={onEditEffects}
            fullWidth
            variant='outline'
            className='border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20'
          >
            <Icon name='sparkles' size='md' className='mr-2' />
            {t.ui.editEffects}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Edit Effects Content ──────────────────────────────────────────────────

function EditEffectsContent({
  player,
  onAddEffect,
  onRemoveEffect,
  onBack,
  onOpenConfig,
}: {
  player: PlayerState
  onAddEffect: (
    playerId: string,
    effectType: string,
    data?: Record<string, unknown>,
  ) => void
  onRemoveEffect: (playerId: string, effectType: string) => void
  onBack: () => void
  onOpenConfig: (
    effectDef: EffectDefinition,
    mode: 'add' | 'edit',
    effectInstance?: EffectInstance,
  ) => void
}) {
  const { t, language } = useI18n()
  const allEffects = getAllEffects()
  const currentEffectTypes = player.effects.map((e) => e.type)
  const getEffectName = (effectType: string) =>
    getRegistryEffectName(effectType, language)

  const handleAddEffect = (effectDef: EffectDefinition) => {
    if (effectDef.ConfigEditor) {
      onOpenConfig(effectDef, 'add')
    } else {
      onAddEffect(player.id, effectDef.id)
    }
  }

  const handleEditEffect = (effectInstance: EffectInstance) => {
    const effectDef = getEffect(effectInstance.type)
    if (!effectDef?.ConfigEditor) return
    onOpenConfig(effectDef, 'edit', effectInstance)
  }

  return (
    <div className='space-y-6'>
      <p className='text-parchment-400 text-sm text-center'>{player.name}</p>

      <div>
        <div className='flex items-center gap-2 mb-3'>
          <Icon name='sparkles' size='sm' className='text-cyan-400' />
          <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
            {t.ui.currentEffects}
          </span>
        </div>
        {currentEffectTypes.length === 0 ? (
          <p className='text-parchment-500 text-sm italic'>{t.ui.noEffects}</p>
        ) : (
          <div className='space-y-2'>
            {player.effects.map((effectInstance, index) => {
              const effect = getEffect(effectInstance.type)
              const effectName = getEffectName(effectInstance.type)
              const effectType = getEffectType(effectInstance, effect)
              const badgeVariant = EFFECT_TYPE_BADGE_VARIANT[effectType]
              const hasConfig = !!effect?.ConfigEditor
              const DescriptionComponent = effect?.Description

              return (
                <div
                  key={`${effectInstance.type}-${index}`}
                  className='bg-white/5 rounded-lg p-3 border border-white/10'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 min-w-0'>
                      {effect && (
                        <Badge variant={badgeVariant}>
                          <Icon name={effect.icon} size='xs' />
                        </Badge>
                      )}
                      <span className='text-parchment-200 text-sm truncate'>
                        {effectName}
                      </span>
                    </div>
                    <div className='flex items-center gap-1 shrink-0'>
                      {hasConfig && (
                        <Button
                          onClick={() => handleEditEffect(effectInstance)}
                          size='icon'
                          variant='ghost'
                          className='text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 min-w-[44px] min-h-[44px]'
                        >
                          <Icon name='pencil' size='sm' />
                        </Button>
                      )}
                      <Button
                        onClick={() =>
                          onRemoveEffect(player.id, effectInstance.type)
                        }
                        size='icon'
                        variant='ghost'
                        className='text-red-400 hover:text-red-300 hover:bg-red-900/20 min-w-[44px] min-h-[44px]'
                      >
                        <Icon name='minus' size='sm' />
                      </Button>
                    </div>
                  </div>
                  {DescriptionComponent && (
                    <div className='text-parchment-400 text-xs mt-2 leading-relaxed'>
                      <DescriptionComponent
                        instance={effectInstance}
                        language={language}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div className='flex items-center gap-2 mb-3'>
          <Icon name='plus' size='sm' className='text-green-400' />
          <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
            {t.ui.addEffect}
          </span>
        </div>
        <div className='space-y-1.5'>
          {allEffects.map((effect) => {
            const effectName = getEffectName(effect.id)
            const alreadyHas = hasEffect(player, effect.id)
            const hasConfig = !!effect.ConfigEditor

            return (
              <button
                key={effect.id}
                onClick={() => handleAddEffect(effect)}
                disabled={alreadyHas}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border transition-colors text-left min-h-[44px]',
                  alreadyHas
                    ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 hover:border-green-500/50 hover:bg-green-900/20',
                )}
              >
                <Icon
                  name={effect.icon}
                  size='md'
                  className={
                    alreadyHas ? 'text-parchment-500' : 'text-parchment-300'
                  }
                />
                <span
                  className={cn(
                    'text-sm flex-1',
                    alreadyHas ? 'text-parchment-500' : 'text-parchment-200',
                  )}
                >
                  {effectName}
                </span>
                {hasConfig && !alreadyHas && (
                  <Icon
                    name='settings'
                    size='xs'
                    className='text-parchment-500'
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Button onClick={onBack} fullWidth variant='outline'>
        {t.common.back}
      </Button>
    </div>
  )
}

// ─── Effect Config Content ───────────────────────────────────────────────────

function EffectConfigContent({
  player,
  state,
  effectDef,
  effectInstance,
  effectName,
  onSave,
  onCancel,
}: {
  player: PlayerState
  state: GameState
  effectDef: EffectDefinition
  effectInstance?: EffectInstance
  effectName: string
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const { language } = useI18n()
  const ConfigEditor = effectDef.ConfigEditor!
  const existingData = effectInstance?.data

  return (
    <div className='space-y-4'>
      <div className='flex justify-center'>
        <div className='w-16 h-16 rounded-full bg-cyan-900/30 border-2 border-cyan-500/40 flex items-center justify-center'>
          <Icon name={effectDef.icon} size='2xl' className='text-cyan-400' />
        </div>
      </div>
      <p className='text-parchment-400 text-sm text-center'>
        {effectName} — {player.name}
      </p>
      <ConfigEditor
        data={existingData}
        state={state}
        playerId={player.id}
        language={language}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  )
}
