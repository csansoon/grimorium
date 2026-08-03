import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('sage', 'en', en)
registerRoleTranslations('sage', 'es', es)

const definition: RoleDefinition = {
  id: 'sage',
  team: 'townsfolk',
  icon: 'bookUser',
  nightOrder: null,
  chaos: 52,
  initialEffects: [{ type: 'sage_trigger', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
