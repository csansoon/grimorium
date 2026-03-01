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

registerEffectTranslations('red_herring', 'en', en)
registerEffectTranslations('red_herring', 'es', es)

function RedHerringConfigEditor({
  data,
  state,
  language,
  onSave,
  onCancel,
}: EffectConfigEditorProps) {
  const t = getEffectTranslations('red_herring', language as Language)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    (data?.fortuneTellerId as string) ?? null,
  )

  // Show all players as potential Fortune Tellers (narrator picks the right one)
  const players = state.players

  const handleSave = () => {
    if (!selectedPlayerId) return
    onSave({ ...data, fortuneTellerId: selectedPlayerId })
  }

  return (
    <div className='space-y-4'>
      <p className='text-parchment-300 text-xs font-bold uppercase tracking-wider'>
        {t.configSelectFortuneTeller as string}
      </p>
      <div className='space-y-1 max-h-48 overflow-y-auto'>
        {players.map((p) => {
          const isSelected = selectedPlayerId === p.id
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left text-sm ${isSelected
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  : 'bg-white/5 border-white/10 text-parchment-300 hover:border-white/30'
                }`}
            >
              <Icon
                name={isSelected ? 'circleDot' : 'circle'}
                size='sm'
                className={isSelected ? 'text-amber-400' : 'text-parchment-500'}
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
          disabled={!selectedPlayerId}
        >
          {t.configSave as string}
        </Button>
      </div>
    </div>
  )
}

const definition: EffectDefinition = {
  id: 'red_herring',
  icon: 'fish',
  defaultType: 'marker',
  perceptionModifiers: [
    {
      context: 'team',
      observerRoles: ['fortune_teller'],
      modify: (perception, _target, observer, _state, effectData) => {
        // Only affect the specific Fortune Teller this Red Herring was assigned to
        if (effectData?.fortuneTellerId !== observer.id) return perception
        return { ...perception, team: 'demon' }
      },
    },
  ],
  ConfigEditor: RedHerringConfigEditor,
}

export default definition
