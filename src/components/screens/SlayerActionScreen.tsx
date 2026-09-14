import { useState } from 'react'
import { GameState, isAlive } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { isMalfunctioning } from '../../lib/effects'
import { useI18n } from '../../lib/i18n'
import { DayActionProps, DayActionResult } from '../../lib/pipeline/types'
import { Button, Icon, BackButton } from '../atoms'
import { MysticDivider } from '../items'
import { PlayerPickerList } from '../inputs'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { NarratorSetupLayout } from '../layouts'
import { cn } from '../../lib/utils'

function canRegisterAsDemon(player: GameState['players'][number]): boolean {
  return player.effects.some((effect) => {
    const canRegisterAs = effect.data?.canRegisterAs as
      | { teams?: string[] }
      | undefined
    return canRegisterAs?.teams?.includes('demon') === true
  })
}

/** Build the Slayer's public shot record and, on a hit, a pipeline death. */
export function resolveSlayerShot(
  state: GameState,
  slayerId: string,
  targetId: string,
  registersAsDemon = false,
  malfunctioned = false,
): DayActionResult | null {
  const slayer = state.players.find((player) => player.id === slayerId)
  const target = state.players.find((player) => player.id === targetId)
  if (!slayer || !target) return null

  const actualDemon = getRole(target.roleId)?.team === 'demon'
  const dies =
    !malfunctioned && isAlive(target) && (actualDemon || registersAsDemon)

  return {
    entries: [
      {
        type: 'slayer_shot',
        message: [
          {
            type: 'i18n',
            key: dies
              ? 'roles.slayer.history.targetDied'
              : 'roles.slayer.history.missed',
            params: { slayer: slayerId, target: targetId },
          },
        ],
        data: {
          slayerId,
          targetId,
          hit: dies,
          actualDemon,
          ...(registersAsDemon ? { registeredAsDemon: true } : {}),
          ...(malfunctioned ? { malfunctioned: true } : {}),
        },
      },
    ],
    removeEffects: { [slayerId]: ['slayer_bullet'] },
    intent: dies
      ? {
          type: 'kill',
          sourceId: slayerId,
          targetId,
          cause: 'slayer',
        }
      : undefined,
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
  const { t } = useI18n()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [choosingRegistration, setChoosingRegistration] = useState(false)
  const [registersAsDemon, setRegistersAsDemon] = useState<boolean | null>(null)

  const slayer = state.players.find((p) => p.id === playerId)
  const target = state.players.find((p) => p.id === selectedTarget)
  const needsRegistrationChoice =
    !!target &&
    isAlive(target) &&
    !isMalfunctioning(target) &&
    getRole(target.roleId)?.team !== 'demon' &&
    canRegisterAsDemon(target)

  const completeShot = (registration: boolean) => {
    if (!selectedTarget) return
    const result = resolveSlayerShot(
      state,
      playerId,
      selectedTarget,
      registration,
      !!slayer && isMalfunctioning(slayer),
    )
    if (result) onComplete(result)
  }

  const handleConfirm = () => {
    if (!selectedTarget || !slayer) return
    if (needsRegistrationChoice) {
      setRegistersAsDemon(null)
      setChoosingRegistration(true)
      return
    }
    completeShot(false)
  }

  if (choosingRegistration && target) {
    return (
      <NarratorSetupLayout
        icon='drama'
        roleName={t.game.slayerRegistrationTitle}
        playerName={target.name}
        audience='narrator'
        footer={
          <div className='flex gap-3'>
            <Button
              variant='ghost'
              className='flex-1'
              onClick={() => setChoosingRegistration(false)}
            >
              {t.common.back}
            </Button>
            <Button
              variant='night'
              className='flex-1'
              disabled={registersAsDemon === null}
              onClick={() => completeShot(registersAsDemon === true)}
            >
              {t.common.confirm}
            </Button>
          </div>
        }
      >
        <div className='rounded-xl border border-blue-500/30 bg-blue-900/20 p-4 mb-5'>
          <p className='text-sm text-blue-100'>
            {t.game.slayerRegistrationDescription}
          </p>
        </div>

        <div className='space-y-3'>
          {[
            { value: true, label: t.game.registerAsDemon },
            { value: false, label: t.game.registerNormally },
          ].map((option) => (
            <button
              key={String(option.value)}
              type='button'
              onClick={() => setRegistersAsDemon(option.value)}
              className={cn(
                'w-full min-h-[56px] rounded-xl border px-4 py-3 text-left transition-colors flex items-center gap-3',
                registersAsDemon === option.value
                  ? 'bg-blue-500/20 border-blue-400/60 text-blue-100'
                  : 'bg-white/5 border-white/10 text-parchment-300 hover:bg-white/10',
              )}
            >
              <Icon
                name={
                  registersAsDemon === option.value ? 'circleDot' : 'circle'
                }
                size='md'
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </NarratorSetupLayout>
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
            players={state.players}
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
