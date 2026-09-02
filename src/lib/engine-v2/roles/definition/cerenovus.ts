import { getAllRoles } from '../../../roles'
import { createInformationIntent } from '../../intents'
import { applyMadness, createMadness } from '../../madness'
import { isGoodRoleId } from '../../roleHelpers'
import { getPlayer, isPlayerTrulyAlive } from '../../state'
import type { EngineRoleCompositeResult, EngineRoleDefinition } from '../types'

function getAvailableClaimRoleIds(): string[] {
  return getAllRoles()
    .map((role) => role.id)
    .filter((roleId) => isGoodRoleId(roleId))
}

export const cerenovusRole: EngineRoleDefinition = {
  id: 'cerenovus',
  roleTeam: 'minion',
  abilityUsage: [
    {
      abilityId: 'inflict_madness',
      actionKind: 'inflict_madness',
      cadence: 'once_per_night',
      consumeWhen: 'on_attempt',
      allowedWhile: 'alive_only',
    },
  ],
  performAbility: ({ state, player }, action) => {
    if (
      action.kind !== 'inflict_madness' ||
      typeof action.targetPlayerId !== 'string' ||
      typeof action.claimRoleId !== 'string'
    ) {
      return state
    }

    if (
      action.targetPlayerId === player.id ||
      !getAvailableClaimRoleIds().includes(action.claimRoleId)
    ) {
      return state
    }

    const target = getPlayer(state, action.targetPlayerId)
    if (!target || !isPlayerTrulyAlive(target)) {
      return state
    }

    const baseState = applyMadness(
      state,
      createMadness({
        targetPlayerId: target.id,
        claimRoleId: action.claimRoleId,
        sourcePlayerId: player.id,
        sourceRoleId: player.roleId,
        reason: `Cerenovus made ${target.name} mad as ${action.claimRoleId}.`,
        expiresAt: {
          mode: 'trigger',
          trigger: 'day_ended',
        },
      }),
    )

    return {
      baseState,
      intents: [
        createInformationIntent({
          audience: 'player',
          playerId: target.id,
          title: 'Cerenovus',
          summary: `You are mad that you are ${action.claimRoleId} tomorrow.`,
          sourcePlayerId: player.id,
          sourceRoleId: player.roleId,
          fragments: [
            { kind: 'text', text: 'You are mad that you are ' },
            { kind: 'role', roleId: action.claimRoleId },
            { kind: 'text', text: ' tomorrow.' },
          ],
        }),
      ],
    } satisfies EngineRoleCompositeResult
  },
}
