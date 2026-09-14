import { useState } from 'react'
import { NominateIntent, PipelineInputProps } from '../../lib/pipeline/types'
import { useI18n, interpolate } from '../../lib/i18n'
import { Icon } from '../atoms'
import { NarratorSetupLayout } from '../layouts'
import { cn } from '../../lib/utils'

export function VirginRegistrationUI({
  state,
  intent,
  onComplete,
}: PipelineInputProps) {
  const { t } = useI18n()
  const nomination = intent as NominateIntent
  const nominator = state.players.find(
    (player) => player.id === nomination.nominatorId,
  )
  const [registersAsTownsfolk, setRegistersAsTownsfolk] = useState<
    boolean | null
  >(null)

  return (
    <NarratorSetupLayout
      icon='flowerLotus'
      roleName={t.game.virginRegistrationTitle}
      playerName={nominator?.name ?? t.ui.unknown}
      onShowToPlayer={() => onComplete(registersAsTownsfolk)}
      showToPlayerDisabled={registersAsTownsfolk === null}
      showToPlayerLabel={t.common.confirm}
    >
      <div className='rounded-xl border border-amber-500/30 bg-amber-900/20 p-4 mb-5'>
        <div className='flex items-start gap-3'>
          <Icon name='hatGlasses' size='lg' className='text-amber-300 mt-0.5' />
          <p className='text-sm text-amber-100'>
            {interpolate(t.game.virginRegistrationDescription, {
              player: nominator?.name ?? t.ui.unknown,
            })}
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        {[
          { value: true, label: t.game.registerAsTownsfolk },
          { value: false, label: t.game.registerNormally },
        ].map((option) => (
          <button
            key={String(option.value)}
            type='button'
            onClick={() => setRegistersAsTownsfolk(option.value)}
            className={cn(
              'w-full min-h-[56px] rounded-xl border px-4 py-3 text-left transition-colors flex items-center gap-3',
              registersAsTownsfolk === option.value
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-100'
                : 'bg-white/5 border-white/10 text-parchment-300 hover:bg-white/10',
            )}
          >
            <Icon
              name={
                registersAsTownsfolk === option.value ? 'circleDot' : 'circle'
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
