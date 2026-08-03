import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('barber', 'en', en)
registerRoleTranslations('barber', 'es', es)

const definition: RoleDefinition = {
  id: 'barber',
  team: 'outsider',
  icon: 'shuffle',
  nightOrder: null,
  chaos: 70,
  initialEffects: [{ type: 'barber_trigger', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
