import { getPlayer } from '../../state'
import {
  createAlignmentChangeIntent,
  createInformationIntent,
  createRoleChangeIntent,
  createTimedStatusIntent,
} from '../../intents'
import { isDemonRoleId } from '../../roleMetadata'
import type { EngineRoleDefinition } from '../types'

export const snakeCharmerRole: EngineRoleDefinition = {
  id: 'snake_charmer',
  roleTeam: 'townsfolk',
  abilityUsage: [
    {
      abilityId: 'charm',
      actionKind: 'charm',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'charm' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    if (action.targetPlayerId === player.id) {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target || target.life.projection.trueState !== 'alive') {
      return state
    }

    if (!isDemonRoleId(target.roleId)) {
      return state
    }

    return [
      createRoleChangeIntent({
        playerId: player.id,
        newRoleId: target.roleId,
        reason: 'Snake Charmer swapped into the chosen Demon role.',
      }),
      createAlignmentChangeIntent({
        playerId: player.id,
        newAlignment: target.alignment,
        reason: 'Snake Charmer took the chosen Demon alignment.',
      }),
      createRoleChangeIntent({
        playerId: target.id,
        newRoleId: 'snake_charmer',
        reason: 'Chosen Demon became the Snake Charmer.',
      }),
      createAlignmentChangeIntent({
        playerId: target.id,
        newAlignment: player.alignment,
        reason: 'Chosen Demon took the Snake Charmer alignment.',
      }),
      createTimedStatusIntent({
        type: 'poisoned',
        targetPlayerId: target.id,
        sourcePlayerId: player.id,
        sourceRoleId: player.roleId,
        reason: 'Old Demon is poisoned after the Snake Charmer swap.',
      }),
      createInformationIntent({
        audience: 'player',
        playerId: player.id,
        title: 'Your role has changed',
        summary: 'You are now the Demon.',
        fragments: [
          { kind: 'text', text: 'You are now ' },
          { kind: 'role', roleId: target.roleId },
          { kind: 'text', text: ' and your alignment is ' },
          { kind: 'alignment', alignment: target.alignment },
          { kind: 'text', text: '.' },
        ],
        sourcePlayerId: player.id,
        sourceRoleId: player.roleId,
      }),
      createInformationIntent({
        audience: 'player',
        playerId: target.id,
        title: 'Your role has changed',
        summary: 'You are now the Snake Charmer.',
        fragments: [
          { kind: 'text', text: 'You are now ' },
          { kind: 'role', roleId: 'snake_charmer' },
          { kind: 'text', text: ' and your alignment is ' },
          { kind: 'alignment', alignment: player.alignment },
          { kind: 'text', text: '.' },
        ],
        sourcePlayerId: player.id,
        sourceRoleId: player.roleId,
      }),
    ]
  },
}
