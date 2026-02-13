import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { getAlivePlayers } from '../../../../types'
import { isMalfunctioning } from '../../../../effects'
import { registerRoleTranslations } from '../../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('mayor', 'en', en)
registerRoleTranslations('mayor', 'es', es)

const definition: RoleDefinition = {
  id: 'mayor',
  team: 'townsfolk',
  icon: 'landmark',
  nightOrder: null, // Doesn't wake at night — passive ability
  chaos: 45,

  // Mayor gets Deflect effect at game start (redirects Demon kills)
  initialEffects: [{ type: 'deflect', expiresAt: 'never' }],

  // Mayor's peaceful victory: 3 alive, no execution today, Mayor alive
  winConditions: [
    {
      trigger: 'end_of_day',
      check: (state, game) => {
        if (state.phase !== 'day') return null

        const alivePlayers = getAlivePlayers(state)
        if (alivePlayers.length !== 3) return null

        // Check if an execution happened today
        for (let i = game.history.length - 1; i >= 0; i--) {
          const entry = game.history[i]
          if (entry.type === 'day_started') break
          if (entry.type === 'execution' || entry.type === 'virgin_execution') {
            return null // Execution happened — no peaceful victory
          }
        }

        // Check if any alive, non-malfunctioning player is the Mayor
        // (A Drunk-as-Mayor has roleId 'mayor' but is malfunctioning,
        // so they shouldn't count for the peaceful victory)
        const hasAliveMayor = alivePlayers.some(
          (p) => p.roleId === 'mayor' && !isMalfunctioning(p),
        )
        if (!hasAliveMayor) return null

        return 'townsfolk'
      },
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
