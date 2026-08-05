import { useState } from 'react'
import { GameState, PlayerState, isAlive } from '../../lib/types'
import { isMalfunctioning } from '../../lib/effects'
import { getRoleName, useI18n } from '../../lib/i18n'
import {
  applyPerceptionOverrides,
  canRegisterAsTeam,
  perceive,
} from '../../lib/pipeline'
import {
  DayActionProps,
  DayActionResult,
  Perception,
} from '../../lib/pipeline/types'
import { Button, Icon, BackButton } from '../atoms'
import { MysticDivider, PerceptionConfigStep } from '../items'
import { PlayerPickerList } from '../inputs'
import { ScreenFooter } from '../layouts/ScreenFooter'

type Phase = 'select_target' | 'configure_perception'

export function shouldPromptForSlayerDemonRegistration(
  slayer: PlayerState | undefined,
  target: PlayerState | undefined,
): boolean {
  if (!slayer || !target) return false
  return !isMalfunctioning(slayer) && canRegisterAsTeam(target, 'demon')
}

export function buildSlayerShotResult(
  state: GameState,
  playerId: string,
  targetId: string,
  perceptionOverrides: Record<string, Partial<Perception>> = {},
): DayActionResult | null {
  const effectiveState = applyPerceptionOverrides(state, perceptionOverrides)
  const slayer = effectiveState.players.find((p) => p.id === playerId)
  const target = effectiveState.players.find((p) => p.id === targetId)
  if (!slayer || !target) return null

  const malfunctioning = isMalfunctioning(slayer)
  const perceivedTeam = perceive(target, slayer, 'team', effectiveState).team
  const hit = !malfunctioning && perceivedTeam === 'demon'
  const perceptionData =
    Object.keys(perceptionOverrides).length > 0
      ? { perceptionOverrides }
      : {}

  if (hit) {
    return {
      entries: [
        {
          type: 'slayer_shot',
          message: [
            {
              type: 'i18n',
              key: 'roles.slayer.history.killedDemon',
              params: {
                slayer: playerId,
                target: targetId,
              },
            },
          ],
          data: {
            slayerId: playerId,
            targetId,
            hit: true,
            perceivedTeam,
            ...perceptionData,
          },
        },
      ],
      removeEffects: { [playerId]: ['slayer_bullet'] },
      intent: {
        type: 'kill',
        sourceId: playerId,
        targetId,
        cause: 'slayer_shot',
      },
    }
  }

  return {
    entries: [
      {
        type: 'slayer_shot',
        message: [
          {
            type: 'i18n',
            key: 'roles.slayer.history.missed',
            params: {
              slayer: playerId,
              target: targetId,
            },
          },
        ],
        data: {
          slayerId: playerId,
          targetId,
          hit: false,
          perceivedTeam,
          ...(malfunctioning ? { malfunctioned: true } : {}),
          ...perceptionData,
        },
      },
    ],
    removeEffects: { [playerId]: ['slayer_bullet'] },
  }
}

/**
 * Day action component for the Slayer's ability.
 * The Slayer picks a target to shoot. If the target is the Demon, they die.
 */
export function SlayerActionScreen({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  const { t, language } = useI18n()
  const [phase, setPhase] = useState<Phase>('select_target')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

  const slayer = state.players.find((p) => p.id === playerId)
  const alivePlayers = state.players.filter((p) => isAlive(p))
  const target = selectedTarget
    ? state.players.find((p) => p.id === selectedTarget)
    : undefined

  const completeShot = (
    perceptionOverrides: Record<string, Partial<Perception>> = {},
  ) => {
    if (!selectedTarget) return

    const result = buildSlayerShotResult(
      state,
      playerId,
      selectedTarget,
      perceptionOverrides,
    )
    if (result) onComplete(result)
  }

  const handleConfirm = () => {
    if (!selectedTarget || !slayer) return

    const target = state.players.find((p) => p.id === selectedTarget)
    if (!target) return

    if (shouldPromptForSlayerDemonRegistration(slayer, target)) {
      setPhase('configure_perception')
      return
    }

    completeShot()
  }

  if (phase === 'configure_perception' && slayer && target) {
    return (
      <PerceptionConfigStep
        ambiguousPlayers={[target]}
        context='team'
        state={state}
        roleIcon='crosshair'
        roleName={getRoleName('slayer', language)}
        playerName={slayer.name}
        onComplete={completeShot}
      />
    )
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-amber-950 via-orange-950 to-grimoire-dark flex flex-col'>
      {/* Header */}
      <div className='bg-gradient-to-b from-amber-900/50 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          <div className='flex items-center mb-4'>
            <BackButton onClick={onBack} />
            <span className='text-parchment-500 text-xs ml-1'>
              {t.common.back}
            </span>
          </div>

          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon
                name='crosshair'
                size='3xl'
                className='text-red-400 text-glow-red'
              />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {t.game.slayerAction}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {t.game.slayerActionDescription}
            </p>
            {slayer && (
              <p className='text-amber-400 text-sm mt-1 font-medium'>
                {slayer.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        <MysticDivider className='mb-6' />

        {/* Select Target */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-3 px-1'>
            <span className='w-6 h-6 rounded-full bg-red-700 text-parchment-100 text-sm font-bold flex items-center justify-center'>
              1
            </span>
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
              {t.game.selectTarget}
            </span>
          </div>
          <PlayerPickerList
            players={alivePlayers}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-red-500/30'>
        <Button
          onClick={handleConfirm}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='slayer'
        >
          <Icon name='crosshair' size='md' className='mr-2' />
          {t.game.confirmSlayerShot}
        </Button>
      </ScreenFooter>
    </div>
  )
}
