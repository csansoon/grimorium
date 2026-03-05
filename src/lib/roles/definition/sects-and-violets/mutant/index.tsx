import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('mutant', 'en', en)
registerRoleTranslations('mutant', 'es', es)

const definition: RoleDefinition = {
  id: 'mutant',
  team: 'outsider',
  icon: 'zapOff',
  nightOrder: null,
  chaos: 68,
  initialEffects: [{ type: 'mutant_execution', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
