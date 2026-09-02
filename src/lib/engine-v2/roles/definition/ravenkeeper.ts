import { getAllRoles } from '../../../roles'
import {
  constrainedFalseRolePolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import { createAutomaticOutcomeNoticeIntent } from '../../storyteller'
import { addAbilityOverride, getPlayer, type EngineState } from '../../state'
import type { EngineRoleDefinition } from '../types'

function getFallbackRoleIds(actualRoleId: string): string[] {
  return getAllRoles()
    .map((role) => role.id)
    .filter((roleId) => roleId !== actualRoleId)
}

function createRavenkeeperResult(
  state: EngineState,
  playerId: string,
  sourceRoleId: string,
  targetPlayerId: string,
) {
  const target = getPlayer(state, targetPlayerId)
  if (!target) {
    return state
  }

  return createInformationFlow<string>({
    id: `ravenkeeper:${playerId}:${target.id}`,
    playerId,
    sourceRoleId,
    truthful: () => ({
      truth: target.roleId,
      packet: {
        title: 'Ravenkeeper',
        summary: 'This is the chosen player’s character.',
        fragments: [
          { kind: 'player', playerId: target.id },
          { kind: 'text', text: ' is ' },
          { kind: 'role', roleId: target.roleId },
          { kind: 'text', text: '.' },
        ],
      },
    }),
    malfunctionPolicy: playerMalfunctionPolicy(
      state,
      playerId,
      constrainedFalseRolePolicy({
        promptTitle: 'Choose Ravenkeeper result',
        promptMessage:
          'This ability is malfunctioning. Choose which role to show for the chosen player.',
        candidateRoleIds: getFallbackRoleIds(target.roleId),
        packet: {
          title: 'Ravenkeeper',
          summary: 'Storyteller-selected malfunction result.',
          fragments: [
            { kind: 'player', playerId: target.id },
            { kind: 'text', text: ' is ' },
            { kind: 'selected_role' },
            { kind: 'text', text: '.' },
          ],
        },
      }),
    ),
  })
}

export const ravenkeeperRole: EngineRoleDefinition = {
  id: 'ravenkeeper',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: ({ player }) =>
    player.notes?.ravenkeeperCanActAtNightDeath === true,
  abilityUsage: [
    {
      abilityId: 'inspect_after_night_death',
      actionKind: 'inspect_after_night_death',
      cadence: 'once_per_game',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_constrained_falsehood',
    },
  ],
  getDynamicAbilityOverrides: ({ player }) => {
    if (player.notes?.ravenkeeperCanActAtNightDeath !== true) {
      return []
    }

    return [
      {
        id: `ravenkeeper:${player.id}:allow-dead-inspect`,
        playerId: player.id,
        abilityId: 'inspect_after_night_death',
        allowWhileDead: true,
        reason: 'Ravenkeeper died at night and may inspect a player.',
      },
    ]
  },
  getRoleTriggers: ({ player }) => [
    {
      id: `${player.id}:ravenkeeper-night-death`,
      event: 'onPlayerDied' as const,
      scope: { subject: 'self' as const },
      when: (_ctx, occurrence) =>
        occurrence.subject.kind === 'player' &&
        (occurrence.subject.phase === 'first_night' ||
          occurrence.subject.phase === 'other_night'),
      handle: ({ state, player: currentPlayer }) => {
        let nextState = addAbilityOverride(state, {
          id: `ravenkeeper:${currentPlayer.id}:night-death-override`,
          playerId: currentPlayer.id,
          abilityId: 'inspect_after_night_death',
          allowWhileDead: true,
          sourcePlayerId: currentPlayer.id,
          sourceRoleId: currentPlayer.roleId,
          reason: 'Ravenkeeper died at night and may inspect a player.',
        })

        nextState = {
          ...nextState,
          players: nextState.players.map((candidate) =>
            candidate.id === currentPlayer.id
              ? {
                  ...candidate,
                  notes: {
                    ...(candidate.notes ?? {}),
                    ravenkeeperCanActAtNightDeath: true,
                  },
                }
              : candidate,
          ),
        }

        return {
          baseState: nextState,
          intents: [
            createAutomaticOutcomeNoticeIntent({
              id: `${currentPlayer.id}:ravenkeeper-night-death:${state.events.length}`,
              title: 'Ravenkeeper can act',
              message: `${currentPlayer.name} died at night and may now inspect a player.`,
              playerIds: [currentPlayer.id],
              sourcePlayerId: currentPlayer.id,
              sourceRoleId: currentPlayer.roleId,
            }),
          ],
        }
      },
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (
      action.kind !== 'inspect_after_night_death' ||
      typeof action.targetPlayerId !== 'string'
    ) {
      return state
    }

    if (player.notes?.ravenkeeperCanActAtNightDeath !== true) {
      return state
    }

    return createRavenkeeperResult(
      state,
      player.id,
      player.roleId,
      action.targetPlayerId,
    )
  },
}
