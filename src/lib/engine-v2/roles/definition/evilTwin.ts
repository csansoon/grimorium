import { createInformationIntent } from '../../intents'
import { getResolvedRoleTeam } from '../../roleHelpers'
import { clearPlayerNote, getPlayer, setPlayerNote, type EngineState } from '../../state'
import { createGameOutcomeProposalIntent } from '../../storyteller'
import type { EngineRoleCompositeResult, EngineRoleDefinition } from '../types'

const COUNTERPART_NOTE_KEY = 'evilTwinCounterpartId'
const IS_EVIL_TWIN_NOTE_KEY = 'evilTwinIsEvil'

function clearTwinNotes(state: EngineState): EngineState {
  let nextState = state

  for (const player of state.players) {
    nextState = clearPlayerNote(nextState, player.id, COUNTERPART_NOTE_KEY)
    nextState = clearPlayerNote(nextState, player.id, IS_EVIL_TWIN_NOTE_KEY)
  }

  return nextState
}

function isEligibleCounterpartRole(roleId: string): boolean {
  const team = getResolvedRoleTeam(roleId)
  return team === 'townsfolk' || team === 'outsider'
}

export const evilTwinRole: EngineRoleDefinition = {
  id: 'evil_twin',
  roleTeam: 'minion',
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'link_twin' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target || target.id === player.id || !isEligibleCounterpartRole(target.roleId)) {
      return state
    }

    let nextState = clearTwinNotes(state)
    nextState = setPlayerNote(nextState, player.id, COUNTERPART_NOTE_KEY, target.id)
    nextState = setPlayerNote(nextState, player.id, IS_EVIL_TWIN_NOTE_KEY, true)
    nextState = setPlayerNote(nextState, target.id, COUNTERPART_NOTE_KEY, player.id)
    nextState = setPlayerNote(nextState, target.id, IS_EVIL_TWIN_NOTE_KEY, false)

    const result: EngineRoleCompositeResult = {
      baseState: nextState,
      intents: [
        createInformationIntent({
          audience: 'player',
          playerId: player.id,
          title: 'Your good twin',
          summary: 'Learn which player is your good twin.',
          fragments: [
            { kind: 'text', text: 'Your good twin is ' },
            { kind: 'player', playerId: target.id },
            { kind: 'text', text: '.' },
          ],
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
        }),
        createInformationIntent({
          audience: 'player',
          playerId: target.id,
          title: 'Your evil twin',
          summary: 'Learn which player is your evil twin.',
          fragments: [
            { kind: 'text', text: 'Your evil twin is ' },
            { kind: 'player', playerId: player.id },
            { kind: 'text', text: '.' },
          ],
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
        }),
      ],
    }

    return result
  },
  getRoleTriggers: ({ player }) => [
    {
      id: `${player.id}:evil-twin-execution-outcome`,
      event: 'onPlayerExecuted',
      scope: { subject: 'any' },
      when: ({ player: currentPlayer }, occurrence) => {
        if (occurrence.subject.kind !== 'player') {
          return false
        }

        const counterpartId = currentPlayer.notes?.[COUNTERPART_NOTE_KEY]
        return (
          typeof counterpartId === 'string' &&
          (occurrence.subject.playerId === currentPlayer.id ||
            occurrence.subject.playerId === counterpartId)
        )
      },
      handle: ({ state, player: currentPlayer }, occurrence) => {
        const counterpartId = currentPlayer.notes?.[COUNTERPART_NOTE_KEY] as string
        const executedPlayerId =
          occurrence.subject.kind === 'player' ? occurrence.subject.playerId : null
        const executedPlayer = executedPlayerId ? getPlayer(state, executedPlayerId) : null
        const executedIsEvilTwin = executedPlayerId === currentPlayer.id

        return createGameOutcomeProposalIntent({
          title:
            executedIsEvilTwin
              ? 'Evil Twin executed'
              : 'Good Twin executed',
          message:
            executedIsEvilTwin
              ? 'The Evil Twin was executed. End the game for good, or continue anyway?'
              : 'The Good Twin was executed. End the game for evil, or continue anyway?',
          winner: executedIsEvilTwin ? 'townsfolk' : 'demon',
          reason:
            executedIsEvilTwin
              ? `Evil Twin ${currentPlayer.name} was executed.`
              : `Good Twin ${executedPlayer?.name ?? counterpartId} was executed.`,
          sourcePlayerId: currentPlayer.id,
          sourceRoleId: currentPlayer.roleId,
        })
      },
    },
  ],
}
