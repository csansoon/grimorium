import { EffectDefinition } from '../../types'
import { Perception } from '../../../pipeline/types'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('recluse_misregister', 'en', en)
registerEffectTranslations('recluse_misregister', 'es', es)

const definition: EffectDefinition = {
  id: 'recluse_misregister',
  icon: 'candleHolderLit',
  defaultType: 'perception',
  canRegisterAs: {
    teams: ['minion', 'demon'],
    alignments: ['evil'],
  },
  perceptionModifiers: [
    {
      context: ['alignment', 'team', 'role'],
      modify: (perception, _target, _observer, _state, effectData) => {
        const overrides = effectData?.perceiveAs as
          | Partial<Perception>
          | undefined
        if (!overrides) return perception
        return { ...perception, ...overrides }
      },
    },
  ],
}

export default definition
