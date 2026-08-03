import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('artist', 'en', en)
registerRoleTranslations('artist', 'es', es)

const definition: RoleDefinition = {
  id: 'artist',
  team: 'townsfolk',
  icon: 'pencil',
  nightOrder: null,
  chaos: 52,
  initialEffects: [{ type: 'artist_question', expiresAt: 'never' }],
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
}

export default definition
