import type { SurvivalModifier } from '../../types'
import type { EngineRoleDefinition } from '../types'
import { isRoleActive } from '../runtime'

export const zombuulRole: EngineRoleDefinition = {
  id: 'zombuul',
  roleTeam: 'demon',
  getDynamicModifiers: ({ state, player }) => {
    if (!isRoleActive(state, player.id) || player.life.deathCount > 0) {
      return []
    }

    return [
      {
        id: `zombuul:${player.id}:first-public-death`,
        kind: 'survival_charge',
        targetPlayerId: player.id,
        charges: 1,
        consumeOnUse: true,
        survivalOutcome: 'publicly_dead_but_alive',
        reason: 'Zombuul appears dead the first time they would die, but remains alive.',
      } satisfies SurvivalModifier,
    ]
  },
}
