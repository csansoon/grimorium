import { EffectDefinition } from '../../types'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('butler_master', 'en', en)
registerEffectTranslations('butler_master', 'es', es)

/**
 * Butler Master — marks which player is the Butler's chosen master.
 *
 * The Butler may only vote if their master is also voting.
 * This effect is applied to the Butler (not the master) each night
 * and stores the master's player ID in `data.masterId`.
 *
 * Voting restriction is enforced visually in VotingPhase — the narrator
 * sees a prominent indicator and manually enforces the rule, consistent
 * with how the physical game works.
 */
const definition: EffectDefinition = {
  id: 'butler_master',
  icon: 'handHeart',
}

export default definition
