import type { SurvivalModifier } from '../../types'
import type { EngineRoleDefinition } from '../types'
import { isRoleActive } from '../runtime'

const FOOL_SPENT_NOTE_KEY = 'foolSurvivalSpent'

export const foolRole: EngineRoleDefinition = {
  id: 'fool',
  roleTeam: 'townsfolk',
  getDynamicModifiers: ({ state, player }) => {
    if (
      !isRoleActive(state, player.id) ||
      player.life.deathCount > 0 ||
      player.notes?.[FOOL_SPENT_NOTE_KEY] === true
    ) {
      return []
    }

    return [
      {
        id: `fool:${player.id}:first-life`,
        kind: 'survival_charge',
        targetPlayerId: player.id,
        charges: 1,
        consumeOnUse: true,
        reason: 'Fool survives the first time they would die.',
        consumedNoteKey: FOOL_SPENT_NOTE_KEY,
      } satisfies SurvivalModifier,
    ]
  },
}
