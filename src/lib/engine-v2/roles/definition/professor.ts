import { getPlayer } from '../../state'
import { createReviveIntent } from '../../intents'
import type { EngineRoleDefinition } from '../types'

const DEMON_ROLE_IDS = new Set([
  'imp',
  'fang_gu',
  'no_dashii',
  'vortox',
  'vigormortis',
  'zombuul',
  'lleech',
  'po',
  'shabaloth',
  'al_hadikhia',
])

export const professorRole: EngineRoleDefinition = {
  id: 'professor',
  roleTeam: 'townsfolk',
  abilityUsage: [
    {
      abilityId: 'revive',
      actionKind: 'revive',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'fail_closed',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'revive' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target) {
      return state
    }

    if (
      target.life.projection.trueState === 'alive' &&
      target.life.projection.publicState === 'alive'
    ) {
      return state
    }

    if (DEMON_ROLE_IDS.has(target.roleId)) {
      return state
    }

    return createReviveIntent({
      targetPlayerId: target.id,
      sourcePlayerId: player.id,
      sourceRoleId: player.roleId,
      reason: 'Professor resurrection',
    })
  },
}
