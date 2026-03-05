import { RoleDefinition } from '../../../types'
import {
  registerRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('savant', 'en', en)
registerRoleTranslations('savant', 'es', es)

const definition: RoleDefinition = {
  id: 'savant',
  team: 'townsfolk',
  icon: 'scrollText',
  nightOrder: null,
  chaos: 62,
  initialEffects: [{ type: 'savant_advice', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
