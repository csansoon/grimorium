import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('recluse', 'en', en)
registerRoleTranslations('recluse', 'es', es)

const definition: RoleDefinition = {
  id: 'recluse',
  team: 'outsider',
  icon: 'candleHolderLit',
  nightOrder: null, // Doesn't wake at night — passive ability
  chaos: 55,

  // Recluse gets misregister effect at game start (narrator configures perceiveAs data)
  // canRegisterAs is stored on the instance data so the generic effect works for both Recluse and Spy
  initialEffects: [
    {
      type: 'misregister',
      expiresAt: 'never',
      data: {
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
      },
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
