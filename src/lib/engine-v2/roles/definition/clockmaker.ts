import { createInformationIntent } from '../../intents'
import { countClosestMinionDistance } from '../../roleHelpers'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
} from '../types'

function createClockmakerInformationPacket(
  playerId: string,
  summary: string,
  distance: number,
) {
  return createInformationIntent({
    audience: 'player',
    playerId,
    title: 'Clockmaker',
    summary,
    fragments: [
      { kind: 'text', text: 'The closest Demon and Minion are ' },
      { kind: 'number', value: distance },
      { kind: 'text', text: ' seats apart.' },
    ],
    sourcePlayerId: playerId,
    sourceRoleId: 'clockmaker',
  })
}

export const clockmakerRole: EngineRoleDefinition = {
  id: 'clockmaker',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  abilityUsage: [
    {
      abilityId: 'learn_distance',
      actionKind: 'learn_distance',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'learn_distance') {
      return state
    }

    const distance = countClosestMinionDistance(state)

    return createClockmakerInformationPacket(
      player.id,
      'This is the shortest seated distance between any Demon and any Minion.',
      distance,
    )
  },
  getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
    {
      id: `${player.id}:clockmaker-first-night`,
      phases: ['first_night'],
      handle: ({ state, player: currentPlayer }) => {
        const distance = countClosestMinionDistance(state)

        return createClockmakerInformationPacket(
          currentPlayer.id,
          'First night Clockmaker setup: this is the shortest seated distance between any Demon and any Minion.',
          distance,
        )
      },
    },
  ],
  getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
    {
      id: `${player.id}:clockmaker-on-role-entered`,
      when: (_ctx, occurrence) =>
        occurrence.engineEvent?.type === 'player_role_changed' &&
        occurrence.engineEvent.newRoleId === 'clockmaker' &&
        occurrence.engineEvent.previousRoleId !== 'clockmaker',
      handle: ({ state, player: currentPlayer }) => {
        const distance = countClosestMinionDistance(state)

        return createClockmakerInformationPacket(
          currentPlayer.id,
          'You just became the Clockmaker. This is the shortest seated distance between any Demon and any Minion.',
          distance,
        )
      },
    },
  ],
}
