import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('scarlet_woman', 'en', en)
registerRoleTranslations('scarlet_woman', 'es', es)

/**
 * Scarlet Woman — Minion role.
 *
 * If there are 5 or more players alive and the Demon dies,
 * the Scarlet Woman becomes the Demon.
 *
 * This is a passive role. All behavior is on the `demon_successor` effect,
 * which intercepts kill and execute intents targeting Demons.
 */
const definition: RoleDefinition = {
  id: 'scarlet_woman',
  team: 'minion',
  icon: 'rose',
  nightOrder: null, // Doesn't wake at night — passive ability
  chaos: 50,

  // Scarlet Woman gets demon_successor effect at game start
  initialEffects: [{ type: 'demon_successor', expiresAt: 'never' }],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
