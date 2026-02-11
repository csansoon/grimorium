import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('virgin', 'en', en)
registerRoleTranslations('virgin', 'es', es)

const definition: RoleDefinition = {
  id: 'virgin',
  team: 'townsfolk',
  icon: 'flower',
  nightOrder: null, // Doesn't wake at night - passive ability

  // Virgin gets Pure effect at game start (used once when nominated)
  initialEffects: [{ type: 'pure', expiresAt: 'never' }],

  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
