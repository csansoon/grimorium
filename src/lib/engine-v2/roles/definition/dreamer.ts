import { getAllRoles } from '../../../roles'
import {
  constrainedFalseRolePolicy,
  constrainedGoodEvilPairPolicy,
  createInformationFlow,
  playerMalfunctionPolicy,
} from './constrainedStorytellerInfo'
import {
  getResolvedRoleTeam,
  isEvilRoleId,
  isGoodRoleId,
} from '../../roleHelpers'
import { getPlayer, isPlayerTrulyAlive } from '../../state'
import type { EngineRoleDefinition } from '../types'

function getRoleIdsForAlignment(alignment: 'good' | 'evil'): string[] {
  return getAllRoles()
    .map((role) => role.id)
    .filter((roleId) =>
      alignment === 'good' ? isGoodRoleId(roleId) : isEvilRoleId(roleId),
    )
}

function getDreamerAlternateRoleIds(correctRoleId: string): string[] {
  const correctTeam = getResolvedRoleTeam(correctRoleId)
  if (!correctTeam) {
    return []
  }

  const wantsGood = correctTeam === 'minion' || correctTeam === 'demon'
  return getRoleIdsForAlignment(wantsGood ? 'good' : 'evil').filter(
    (roleId) => roleId !== correctRoleId,
  )
}

function getDreamerMalfunctionPairIds(): string[] {
  const goodRoleIds = getRoleIdsForAlignment('good')
  const evilRoleIds = getRoleIdsForAlignment('evil')

  return goodRoleIds.flatMap((goodRoleId) =>
    evilRoleIds.map((evilRoleId) => `${goodRoleId}|${evilRoleId}`),
  )
}

export const dreamerRole: EngineRoleDefinition = {
  id: 'dreamer',
  roleTeam: 'townsfolk',
  abilityUsage: [
    {
      abilityId: 'dream',
      actionKind: 'dream',
      cadence: 'once_per_night',
      consumeWhen: 'on_success',
      allowedWhile: 'alive_only',
      malfunctionPolicy: 'storyteller_constrained_falsehood',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (action.kind !== 'dream' || typeof action.targetPlayerId !== 'string') {
      return state
    }

    if (action.targetPlayerId === player.id) {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target || !isPlayerTrulyAlive(target)) {
      return state
    }

    const alternateRoleIds = getDreamerAlternateRoleIds(target.roleId)
    if (alternateRoleIds.length === 0) {
      return state
    }

    return createInformationFlow<string>({
      id: `dreamer:${player.id}:${target.id}:flow`,
      playerId: player.id,
      sourceRoleId: player.roleId,
      truthful: () => ({
        truth: target.roleId,
        packet: {
          title: 'Dreamer',
          summary: 'One of these roles matches the chosen player.',
          fragments: [],
        },
      }),
      malfunctionPolicy: playerMalfunctionPolicy(
        state,
        player.id,
        constrainedGoodEvilPairPolicy({
          promptTitle: 'Choose Dreamer shown roles',
          promptMessage:
            'This ability is malfunctioning. Choose one good role and one evil role to show.',
          candidatePairIds: getDreamerMalfunctionPairIds(),
          packet: {
            title: 'Dreamer',
            summary: 'Storyteller-selected malfunction result.',
            fragments: [
              { kind: 'text', text: 'One of these roles matches ' },
              { kind: 'player', playerId: target.id },
              { kind: 'text', text: ': ' },
              { kind: 'selected_role_pair_first' },
              { kind: 'text', text: ' or ' },
              { kind: 'selected_role_pair_second' },
              { kind: 'text', text: '.' },
            ],
          },
        }),
      ) ?? constrainedFalseRolePolicy({
        promptTitle: 'Choose Dreamer false role',
        promptMessage:
          "Choose the false opposite-team role to show alongside the chosen player's true role.",
        candidateRoleIds: alternateRoleIds,
        packet: {
          title: 'Dreamer',
          summary: 'One of these roles matches the chosen player.',
          fragments: [
            { kind: 'text', text: 'One of these roles matches ' },
            { kind: 'player', playerId: target.id },
            { kind: 'text', text: ': ' },
            ...(isGoodRoleId(target.roleId)
              ? [
                  { kind: 'role' as const, roleId: target.roleId },
                  { kind: 'text' as const, text: ' or ' },
                  { kind: 'selected_role' as const },
                ]
              : [
                  { kind: 'selected_role' as const },
                  { kind: 'text' as const, text: ' or ' },
                  { kind: 'role' as const, roleId: target.roleId },
                ]),
            { kind: 'text', text: '.' },
          ],
        },
      }),
    })
  },
}
