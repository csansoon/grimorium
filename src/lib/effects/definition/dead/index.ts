import { EffectDefinition } from '../../types'
import { hasEffect } from '../../../types'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('dead', 'en', en)
registerEffectTranslations('dead', 'es', es)

const definition: EffectDefinition = {
  id: 'dead',
  icon: 'skull',
  defaultType: 'nerf',

  preventsNightWake: true,
  preventsVoting: true,
  preventsNomination: true,

  // Dead players can vote once if they haven't used their dead vote
  canVote: (player) => {
    return !hasEffect(player, 'used_dead_vote')
  },

  canNominate: () => false,
}

export default definition
