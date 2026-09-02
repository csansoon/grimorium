import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('saint', 'en', en)
registerRoleTranslations('saint', 'es', es)

const definition: RoleDefinition = {
  id: 'saint',
  roleTeam: 'outsider',
  icon: 'starNorth',
  nightOrder: null, // Doesn't wake at night — passive ability
  chaos: 50,

  // Saint gets Martyrdom effect at game start (evil wins if executed)
  initialEffects: [{ type: 'martyrdom', expiresAt: 'never' }],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
