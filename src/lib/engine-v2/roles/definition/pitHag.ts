import { getPlayer, isPlayerTrulyAlive } from '../../state'
import {
  createInformationIntent,
  createRoleChangeIntent,
  createStorytellerNoticeIntent,
} from '../../intents'
import { isRoleInPlay } from '../../roleHelpers'
import { getResolvedRoleTeam } from '../../roleMetadata'
import type { EngineRoleDefinition } from '../types'

export const pitHagRole: EngineRoleDefinition = {
  id: 'pit_hag',
  roleTeam: 'minion',
  abilityUsage: [
    {
      abilityId: 'transform',
      actionKind: 'transform',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (
      action.kind !== 'transform' ||
      typeof action.targetPlayerId !== 'string' ||
      typeof action.newRoleId !== 'string'
    ) {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target || !isPlayerTrulyAlive(target)) {
      return state
    }

    if (isRoleInPlay(state, action.newRoleId)) {
      return createStorytellerNoticeIntent({
        resolutionMode: 'automatic',
        title: 'Pit Hag failed',
        message: `${target.name} could not become ${action.newRoleId} because that role is already in play.`,
        playerIds: [player.id, target.id],
        sourcePlayerId: player.id,
        sourceRoleId: player.roleId,
      })
    }

    const intents = [
      createRoleChangeIntent({
        playerId: target.id,
        newRoleId: action.newRoleId,
        reason: 'Pit Hag transformed this player into a new role.',
      }),
      createInformationIntent({
        audience: 'player',
        playerId: target.id,
        title: 'Your role has changed',
        summary: 'You are now a different character, but your alignment stays the same.',
        fragments: [
          { kind: 'text', text: 'You are now ' },
          { kind: 'role', roleId: action.newRoleId },
          { kind: 'text', text: '. Your alignment is still ' },
          { kind: 'alignment', alignment: target.alignment },
          { kind: 'text', text: '.' },
        ],
        sourcePlayerId: player.id,
        sourceRoleId: player.roleId,
      }),
    ]

    if (getResolvedRoleTeam(action.newRoleId) === 'demon') {
      intents.push(
        createStorytellerNoticeIntent({
          resolutionMode: 'automatic',
          title: 'Pit Hag created a Demon',
          message:
            'A Demon was created. Deaths tonight may now be chosen arbitrarily by the Storyteller.',
          playerIds: [player.id, target.id],
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
        }),
      )
    }

    return intents
  },
}
