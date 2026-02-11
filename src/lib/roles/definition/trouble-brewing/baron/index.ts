import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('baron', 'en', en)
registerRoleTranslations('baron', 'es', es)

/**
 * Baron — Minion role.
 *
 * There are extra Outsiders in play. [+2 Outsiders]
 *
 * The Baron's ability only affects the game setup — when the Baron is
 * in play, the narrator should include 2 extra Outsiders (replacing
 * 2 Townsfolk) in the role distribution.
 *
 * This is a purely passive role with no night action and no effects.
 */
const definition: RoleDefinition = {
  id: 'baron',
  team: 'minion',
  icon: 'hatTop',
  nightOrder: null, // Doesn't wake at night — passive ability

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
