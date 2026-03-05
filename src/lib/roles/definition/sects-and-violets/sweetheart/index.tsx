import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('sweetheart', 'en', en)
registerRoleTranslations('sweetheart', 'es', es)

const definition: RoleDefinition = {
  id: 'sweetheart',
  team: 'outsider',
  icon: 'handHeart',
  nightOrder: null,
  chaos: 56,
  initialEffects: [{ type: 'sweetheart_trigger', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
