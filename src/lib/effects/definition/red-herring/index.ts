import { EffectDefinition } from '../../types'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('red_herring', 'en', en)
registerEffectTranslations('red_herring', 'es', es)

const definition: EffectDefinition = {
  id: 'red_herring',
  icon: 'fish',
  defaultType: 'marker',
  perceptionModifiers: [
    {
      context: 'role',
      observerRoles: ['fortune_teller'],
      modify: (perception, _target, observer, _state, effectData) => {
        // Only affect the specific Fortune Teller this Red Herring was assigned to
        if (effectData?.fortuneTellerId !== observer.id) return perception
        return { ...perception, team: 'demon' }
      },
    },
  ],
}

export default definition
