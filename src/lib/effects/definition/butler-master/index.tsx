import { useState } from 'react'
import { EffectDefinition, EffectConfigEditorProps } from '../../types'
import {
  registerEffectTranslations,
  getEffectTranslations,
} from '../../../i18n'
import type { Language } from '../../../i18n'
import { Button, Icon } from '../../../../components/atoms'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('butler_master', 'en', en)
registerEffectTranslations('butler_master', 'es', es)

function ButlerMasterConfigEditor({
  data,
  state,
  playerId,
  language,
  onSave,
  onCancel,
}: EffectConfigEditorProps) {
  const t = getEffectTranslations('butler_master', language as Language)
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(
    (data?.masterId as string) ?? null,
  )

  // Show all players except the Butler themselves
  const players = state.players.filter((p) => p.id !== playerId)

  const handleSave = () => {
    if (!selectedMasterId) return
    onSave({ ...data, masterId: selectedMasterId })
  }

  return (
    <div className='space-y-4'>
      <p className='text-parchment-300 text-xs font-bold uppercase tracking-wider'>
        {t.configSelectMaster as string}
      </p>
      <div className='space-y-1 max-h-48 overflow-y-auto'>
        {players.map((p) => {
          const isSelected = selectedMasterId === p.id
          return (
            <button
              key={p.id}
              onClick={() => setSelectedMasterId(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left text-sm ${
                isSelected
                  ? 'bg-violet-500/20 border-violet-400/50 text-violet-200'
                  : 'bg-white/5 border-white/10 text-parchment-300 hover:border-white/30'
              }`}
            >
              <Icon
                name={isSelected ? 'circleDot' : 'circle'}
                size='sm'
                className={
                  isSelected ? 'text-violet-400' : 'text-parchment-500'
                }
              />
              <span>{p.name}</span>
            </button>
          )
        })}
      </div>

      <div className='flex gap-2 pt-2'>
        <Button onClick={onCancel} variant='ghost' className='flex-1'>
          {t.configCancel as string}
        </Button>
        <Button
          onClick={handleSave}
          variant='primary'
          className='flex-1'
          disabled={!selectedMasterId}
        >
          {t.configSave as string}
        </Button>
      </div>
    </div>
  )
}

/**
 * Butler Master — marks which player is the Butler's chosen master.
 *
 * The Butler may only vote if their master is also voting.
 * This effect is applied to the Butler (not the master) each night
 * and stores the master's player ID in `data.masterId`.
 *
 * Voting restriction is enforced visually in VotingPhase — the narrator
 * sees a prominent indicator and manually enforces the rule, consistent
 * with how the physical game works.
 */
const definition: EffectDefinition = {
  id: 'butler_master',
  icon: 'handHeart',
  defaultType: 'marker',
  ConfigEditor: ButlerMasterConfigEditor,
}

export default definition
