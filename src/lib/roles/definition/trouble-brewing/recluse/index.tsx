import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('recluse', 'en', en)
registerRoleTranslations('recluse', 'es', es)

const definition: RoleDefinition = {
  id: 'recluse',
  team: 'outsider',
  icon: 'candleHolderLit',
  nightOrder: null, // Doesn't wake at night — passive ability

  // Recluse gets misregister effect at game start (narrator configures perceiveAs data)
  initialEffects: [{ type: 'recluse_misregister', expiresAt: 'never' }],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
