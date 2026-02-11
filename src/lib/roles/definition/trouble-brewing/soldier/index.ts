import { RoleDefinition } from '../../../types'
import { registerRoleTranslations } from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('soldier', 'en', en)
registerRoleTranslations('soldier', 'es', es)

const definition: RoleDefinition = {
  id: 'soldier',
  team: 'townsfolk',
  icon: 'shield',
  nightOrder: null, // Soldier doesn't wake at night - passive ability

  // Soldier gets permanent Safe effect at game start
  initialEffects: [
    { type: 'safe', data: { source: 'soldier' }, expiresAt: 'never' },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
