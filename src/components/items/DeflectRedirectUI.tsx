import { useState } from 'react'
import { PipelineInputProps, KillIntent } from '../../lib/pipeline/types'
import { useI18n, getRoleTranslations, interpolate } from '../../lib/i18n'
import { PlayerPickerList } from '../inputs'
import { Button, Icon } from '../atoms'

/**
 * Pipeline UI component shown when a kill is redirected by the Deflect effect.
 * The narrator selects a new target for the kill (or keeps the original).
 */
export function DeflectRedirectUI({
  state,
  intent,
  onComplete,
}: PipelineInputProps) {
  const { t, language } = useI18n()
  const impT = getRoleTranslations('imp', language)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const kill = intent as KillIntent

  const originalTarget = state.players.find((p) => p.id === kill.targetId)

  // The Storyteller may redirect to any other player. Choosing someone dead
  // or protected is a legal way for nobody to die; the Demon is legal too.
  const redirectCandidates = state.players.filter(
    (player) => player.id !== kill.targetId,
  )

  return (
    <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-purple to-grimoire-darker flex flex-col items-center justify-center p-6'>
      <div className='max-w-sm w-full'>
        {/* Header */}
        <div className='text-center mb-6'>
          <div className='w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mb-4'>
            <Icon name='trendingUpDown' size='2xl' className='text-amber-400' />
          </div>
          <h2 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-2'>
            {impT.deflectTitle}
          </h2>
          <p className='text-parchment-400 text-sm'>
            {interpolate(impT.deflectDescription, {
              target: originalTarget?.name ?? '?',
            })}
          </p>
        </div>

        {/* Player Selector */}
        <div className='mb-6'>
          <PlayerPickerList
            players={redirectCandidates}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>

        {/* Confirm */}
        <Button
          onClick={() => selectedTarget && onComplete(selectedTarget)}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='skull' size='md' className='mr-2' />
          {t.common.confirm}
        </Button>
        <Button
          onClick={() => onComplete(kill.targetId)}
          fullWidth
          size='lg'
          variant='ghost'
          className='mt-3'
        >
          {interpolate(impT.deflectLetMayorDie, {
            target: originalTarget?.name ?? '?',
          })}
        </Button>
      </div>
    </div>
  )
}
