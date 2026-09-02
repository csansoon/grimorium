import { createInformationIntent, createRoleSelectionChoiceIntent } from '../../intents'
import { getInPlayRoleIdsForTeam } from '../../roleHelpers'
import type {
  EngineRoleDefinition,
  EngineRoleEntryTrigger,
  EngineRolePhaseTrigger,
} from '../types'

type PairSignalConfig = {
  id: string
  roleTeam: 'townsfolk'
  targetTeam: 'townsfolk' | 'outsider' | 'minion'
  title: string
  noTargetSummary: string
  roleChoiceTitle: string
  roleChoiceMessage: string
  decoyChoiceTitle: string
  decoyChoiceMessagePrefix: string
  packetTitle: string
  packetSummaryPrefix: string
}

function queueNoTargetInfo(playerId: string, title: string, summary: string, sourceRoleId: string) {
  return createInformationIntent({
    audience: 'player',
    playerId,
    title,
    summary,
    fragments: [{ kind: 'text', text: summary }],
    sourcePlayerId: playerId,
    sourceRoleId,
  })
}

function queueRoleSelection(
  playerId: string,
  sourceRoleId: string,
  config: PairSignalConfig,
  candidateRoleIds: string[],
) {
  return createRoleSelectionChoiceIntent({
    id: `${config.id}:${playerId}:shown-role`,
    resolutionMode: 'choice_required',
    title: config.roleChoiceTitle,
    message: config.roleChoiceMessage,
    sourcePlayerId: playerId,
    sourceRoleId,
    candidatePlayerIds: candidateRoleIds,
    candidateLabels: Object.fromEntries(candidateRoleIds.map((roleId) => [roleId, roleId])),
    onResolve: [
      {
        kind: 'queue_role_signal_decoy_choice',
        infoPlayerId: playerId,
        sourcePlayerId: playerId,
        sourceRoleId,
        roleChoiceTitle: config.roleChoiceTitle,
        roleChoiceMessage: config.roleChoiceMessage,
        decoyChoiceTitle: config.decoyChoiceTitle,
        decoyChoiceMessagePrefix: config.decoyChoiceMessagePrefix,
        packetTitle: config.packetTitle,
        packetSummaryPrefix: config.packetSummaryPrefix,
      },
    ],
  })
}

export function createPairedRoleSignalDefinition(
  config: PairSignalConfig,
): EngineRoleDefinition {
  return {
    id: config.id,
    roleTeam: config.roleTeam,
    shouldQueueNightAction: () => false,
    getPhaseTriggers: ({ player }): EngineRolePhaseTrigger[] => [
      {
        id: `${player.id}:${config.id}:first-night`,
        phases: ['first_night'],
        handle: ({ state, player: currentPlayer }) => {
          const candidateRoleIds = getInPlayRoleIdsForTeam(state, config.targetTeam)
          if (candidateRoleIds.length === 0) {
            return queueNoTargetInfo(
              currentPlayer.id,
              config.packetTitle,
              config.noTargetSummary,
              config.id,
            )
          }

          return queueRoleSelection(currentPlayer.id, config.id, config, candidateRoleIds)
        },
      },
    ],
    getRoleEntryTriggers: ({ player }): EngineRoleEntryTrigger[] => [
      {
        id: `${player.id}:${config.id}:on-role-entered`,
        when: (_ctx, occurrence) =>
          occurrence.engineEvent?.type === 'player_role_changed' &&
          occurrence.engineEvent.newRoleId === config.id &&
          occurrence.engineEvent.previousRoleId !== config.id,
        handle: ({ state, player: currentPlayer }) => {
          const candidateRoleIds = getInPlayRoleIdsForTeam(state, config.targetTeam)
          if (candidateRoleIds.length === 0) {
            return queueNoTargetInfo(
              currentPlayer.id,
              config.packetTitle,
              config.noTargetSummary,
              config.id,
            )
          }

          return queueRoleSelection(currentPlayer.id, config.id, config, candidateRoleIds)
        },
      },
    ],
  }
}
