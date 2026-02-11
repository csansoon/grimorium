import { useState } from 'react'
import { GameState, PlayerState } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getEffect } from '../../lib/effects'
import {
  useI18n,
  getRoleName as getRegistryRoleName,
  getEffectName as getRegistryEffectName,
} from '../../lib/i18n'
import { Perception, PerceptionContext } from '../../lib/pipeline/types'
import { Icon } from '../atoms'
import { NarratorSetupLayout } from '../layouts'
import { cn } from '../../lib/utils'

type Props = {
  /** Players whose perception is ambiguous for this context. */
  ambiguousPlayers: PlayerState[]
  /** What aspect of perception is being configured. */
  context: PerceptionContext
  /** Current game state (for display purposes). */
  state: GameState
  /** Role icon for the layout header. */
  roleIcon: string
  /** Role name for the layout header. */
  roleName: string
  /** Player name (the role's owner) for the layout header. */
  playerName: string
  /** Called when the narrator confirms the overrides. */
  onComplete: (overrides: Record<string, Partial<Perception>>) => void
}

/**
 * Narrator-only screen for configuring how ambiguous players register
 * for a specific role's information ability.
 *
 * For each ambiguous player, shows their actual role and lets the narrator
 * toggle whether they should misregister (e.g., appear evil instead of good).
 * The overrides are ephemeral — they only affect the current night action
 * calculation, no game events are emitted.
 */
export function PerceptionConfigStep({
  ambiguousPlayers,
  context,
  roleIcon,
  roleName,
  playerName,
  onComplete,
}: Props) {
  const { t, language } = useI18n()

  // Track per-player override decisions: null = keep default, object = override
  const [overrides, setOverrides] = useState<
    Record<string, Partial<Perception> | null>
  >(() => {
    const initial: Record<string, Partial<Perception> | null> = {}
    for (const p of ambiguousPlayers) {
      initial[p.id] = null // default: no override
    }
    return initial
  })

  const handleToggleAlignment = (playerId: string, evil: boolean) => {
    setOverrides((prev) => ({
      ...prev,
      [playerId]: evil ? { alignment: 'evil' } : null,
    }))
  }

  const handleConfirm = () => {
    // Build the final overrides map (only include non-null entries)
    const result: Record<string, Partial<Perception>> = {}
    for (const [playerId, override] of Object.entries(overrides)) {
      if (override) {
        result[playerId] = override
      }
    }
    onComplete(result)
  }

  const getRoleName = (roleId: string) => getRegistryRoleName(roleId, language)

  return (
    <NarratorSetupLayout
      icon={roleIcon as any}
      roleName={roleName}
      playerName={playerName}
      onShowToPlayer={handleConfirm}
      showToPlayerLabel={t.common.confirm}
    >
      <div className='text-center mb-4'>
        <h3 className='text-lg font-semibold text-amber-200'>
          {t.game.perceptionConfigTitle}
        </h3>
        <p className='text-sm text-stone-400 mt-1'>
          {t.game.perceptionConfigDescription}
        </p>
      </div>

      <div className='space-y-3'>
        {ambiguousPlayers.map((player) => {
          const role = getRole(player.roleId)
          const isOverriddenEvil = overrides[player.id]?.alignment === 'evil'

          // Find the effect that grants misregistration for display
          const misregisterEffect = player.effects.find((e) => {
            const def = getEffect(e.type)
            if (!def?.canRegisterAs) return false
            if (context === 'alignment' && def.canRegisterAs.alignments?.length)
              return true
            if (context === 'team' && def.canRegisterAs.teams?.length)
              return true
            if (
              context === 'role' &&
              (def.canRegisterAs.teams?.length ||
                def.canRegisterAs.alignments?.length)
            )
              return true
            return false
          })
          const effectDef = misregisterEffect
            ? getEffect(misregisterEffect.type)
            : null
          const effectName = effectDef
            ? getRegistryEffectName(effectDef.id, language)
            : ''

          return (
            <div
              key={player.id}
              className='bg-white/5 rounded-xl border border-white/10 p-4'
            >
              {/* Player info */}
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center'>
                  <Icon
                    name={role?.icon ?? 'user'}
                    size='md'
                    className='text-indigo-300'
                  />
                </div>
                <div>
                  <div className='font-medium text-parchment-100'>
                    {player.name}
                  </div>
                  <div className='text-xs text-parchment-500'>
                    {t.game.actualRole.replace(
                      '{role}',
                      getRoleName(player.roleId),
                    )}{' '}
                    — {effectName}
                  </div>
                </div>
              </div>

              {/* Alignment toggle for "alignment" context */}
              {context === 'alignment' && (
                <div className='flex gap-2'>
                  <button
                    onClick={() => handleToggleAlignment(player.id, false)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                      !isOverriddenEvil
                        ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    <Icon name='shield' size='sm' className='inline mr-1.5' />
                    {t.game.registerAsGood}
                  </button>
                  <button
                    onClick={() => handleToggleAlignment(player.id, true)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                      isOverriddenEvil
                        ? 'bg-red-900/40 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    <Icon name='skull' size='sm' className='inline mr-1.5' />
                    {t.game.registerAsEvil}
                  </button>
                </div>
              )}

              {/* For "role" and "team" contexts, show a simpler default/override toggle */}
              {(context === 'role' || context === 'team') && (
                <div className='flex gap-2'>
                  <button
                    onClick={() => handleToggleAlignment(player.id, false)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                      !isOverriddenEvil
                        ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    {t.game.keepDefault}
                  </button>
                  <button
                    onClick={() => handleToggleAlignment(player.id, true)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                      isOverriddenEvil
                        ? 'bg-red-900/40 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    {t.game.registerAsEvil}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </NarratorSetupLayout>
  )
}
