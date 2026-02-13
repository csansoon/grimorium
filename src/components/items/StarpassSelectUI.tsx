import { useState, useMemo } from 'react'
import { PipelineInputProps } from '../../lib/pipeline/types'
import { isAlive } from '../../lib/types'
import { useI18n, getRoleTranslations } from '../../lib/i18n'
import { getRole } from '../../lib/roles'
import { PlayerPickerList } from '../inputs'
import { Button, Icon } from '../atoms'

/**
 * Pipeline UI component shown when the Imp self-kills with alive minions.
 * The narrator selects which Minion becomes the new Imp.
 */
export function StarpassSelectUI({ state, onComplete }: PipelineInputProps) {
  const { language } = useI18n()
  const impT = getRoleTranslations('imp', language)
  const [selectedMinion, setSelectedMinion] = useState<string | null>(null)

  // Find alive minions
  const aliveMinions = useMemo(
    () =>
      state.players.filter((p) => {
        if (!isAlive(p)) return false
        const role = getRole(p.roleId)
        return role?.team === 'minion'
      }),
    [state.players],
  )

  return (
    <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-purple to-grimoire-darker flex flex-col items-center justify-center p-6'>
      <div className='max-w-sm w-full'>
        {/* Header */}
        <div className='text-center mb-6'>
          <div className='w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-400/30 flex items-center justify-center mb-4'>
            <Icon name='sparkles' size='2xl' className='text-red-400' />
          </div>
          <h2 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-2'>
            {impT.selectNewImpTitle}
          </h2>
          <p className='text-parchment-400 text-sm'>
            {impT.selectNewImpDescription}
          </p>
        </div>

        {/* Minion Selector */}
        <div className='mb-6'>
          <PlayerPickerList
            players={aliveMinions}
            selected={selectedMinion ? [selectedMinion] : []}
            onSelect={setSelectedMinion}
            selectionCount={1}
            variant='red'
          />
        </div>

        {/* Confirm */}
        <Button
          onClick={() => selectedMinion && onComplete(selectedMinion)}
          disabled={!selectedMinion}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='sparkles' size='md' className='mr-2' />
          {impT.confirmNewImp}
        </Button>
      </div>
    </div>
  )
}
