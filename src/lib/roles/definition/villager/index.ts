import { RoleDefinition } from '../../types'
import { DefaultRoleReveal } from '../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('villager', 'en', en)
registerRoleTranslations('villager', 'es', es)

const definition: RoleDefinition = {
  id: 'villager',
  team: 'townsfolk',
  icon: 'user',
  nightOrder: null, // Doesn't wake at night

  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
