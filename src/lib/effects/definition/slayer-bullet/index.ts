import { EffectDefinition } from '../../types'
import { DayActionDefinition } from '../../../pipeline/types'
import { isAlive, hasEffect } from '../../../types'
import { SlayerActionScreen } from '../../../../components/screens/SlayerActionScreen'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('slayer_bullet', 'en', en)
registerEffectTranslations('slayer_bullet', 'es', es)

const slayerDayAction: DayActionDefinition = {
  id: 'slayer_shot',
  icon: 'crosshair',
  getLabel: (t) => t.game.slayerAction,
  getDescription: (t) => t.game.slayerActionDescription,
  condition: (player) => isAlive(player) && hasEffect(player, 'slayer_bullet'),
  ActionComponent: SlayerActionScreen,
}

const definition: EffectDefinition = {
  id: 'slayer_bullet',
  icon: 'crosshair',
  defaultType: 'buff',
  dayActions: [slayerDayAction],
}

export default definition
