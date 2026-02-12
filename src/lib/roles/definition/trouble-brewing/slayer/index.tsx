import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('slayer', 'en', en)
registerRoleTranslations('slayer', 'es', es)

const definition: RoleDefinition = {
  id: 'slayer',
  team: 'townsfolk',
  icon: 'crosshair',
  nightOrder: null, // Doesn't wake at night - day ability
  chaos: 30,

  // Slayer gets their bullet at game start (one-time use)
  initialEffects: [{ type: 'slayer_bullet', expiresAt: 'never' }],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
