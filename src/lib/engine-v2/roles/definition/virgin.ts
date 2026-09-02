import { resolveSpecialExecution } from '../../day'
import { getResolvedRoleTeam } from '../../roleHelpers'
import { getPlayer, setPlayerNote } from '../../state'
import type { EngineRoleDefinition } from '../types'

const VIRGIN_SPENT_NOTE_KEY = 'virginSpent'

function isVirginSpent(value: unknown): boolean {
  return value === true
}

export const virginRole: EngineRoleDefinition = {
  id: 'virgin',
  roleTeam: 'townsfolk',
  getRoleTriggers: () => [
    {
      id: 'virgin:on-nomination',
      event: 'onNominationStarted',
      scope: {
        subject: 'any',
      },
      malfunctionPolicy: 'fail_closed',
      when: ({ player }, occurrence) => {
        if (!occurrence.triggerEvent?.data) {
          return false
        }

        return (
          occurrence.triggerEvent.data.nomineeId === player.id &&
          !isVirginSpent(player.notes?.[VIRGIN_SPENT_NOTE_KEY])
        )
      },
      handleMalfunction: ({ state, player }) =>
        setPlayerNote(state, player.id, VIRGIN_SPENT_NOTE_KEY, true),
      handle: ({ state, player }, occurrence) => {
        const nominationId =
          typeof occurrence.triggerEvent?.data?.nominationId === 'string'
            ? occurrence.triggerEvent.data.nominationId
            : null

        const nominatorId =
          occurrence.subject.kind === 'player' ? occurrence.subject.playerId : null
        const nominator = nominatorId ? getPlayer(state, nominatorId) : null
        if (!nominator) {
          return setPlayerNote(state, player.id, VIRGIN_SPENT_NOTE_KEY, true)
        }

        let nextState = setPlayerNote(state, player.id, VIRGIN_SPENT_NOTE_KEY, true)
        if (getResolvedRoleTeam(nominator.roleId) !== 'townsfolk') {
          return nextState
        }

        return resolveSpecialExecution(nextState, {
          executedPlayerId: nominator.id,
          nominationId,
          sourcePlayerId: player.id,
          reason: 'Virgin triggered: a Townsfolk nominated the Virgin.',
        })
      },
    },
  ],
}
