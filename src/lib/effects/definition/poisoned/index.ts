import { EffectDefinition } from '../../types'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('poisoned', 'en', en)
registerEffectTranslations('poisoned', 'es', es)

/**
 * Poisoned effect — causes the player's ability to malfunction.
 *
 * Applied by the Poisoner each night with `expiresAt: "end_of_day"`.
 * Lasts through the current night AND the following day, affecting both
 * night abilities and day-phase abilities (Slayer, win conditions, etc.).
 * Removed when the next night starts (via `expireEffects("end_of_day")` in `startNight`).
 *
 * This effect has no handlers or modifiers — it acts purely as a flag
 * detected by `isMalfunctioning()`.
 */
const definition: EffectDefinition = {
  id: 'poisoned',
  icon: 'flask',
  poisonsAbility: true,
}

export default definition
