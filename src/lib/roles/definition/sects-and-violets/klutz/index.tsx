import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('klutz', 'en', en)
registerRoleTranslations('klutz', 'es', es)

const definition: RoleDefinition = {
  id: 'klutz',
  team: 'outsider',
  icon: 'drama',
  nightOrder: null,
  chaos: 60,
  initialEffects: [{ type: 'klutz_trigger', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
