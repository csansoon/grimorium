import type { ProtectionModifier } from '../../types'
import type { EngineRoleDefinition } from '../types'
import { getAliveNeighbors, isRolePassiveActive } from '../runtime'

export const teaLadyRole: EngineRoleDefinition = {
  id: 'tea_lady',
  roleTeam: 'townsfolk',
  passiveMalfunctionPolicy: 'suppressed_passive',
  getDynamicModifiers: ({ state, player }) => {
    if (!isRolePassiveActive(state, player.id)) {
      return []
    }

    const [leftNeighbor, rightNeighbor] = getAliveNeighbors(state, player.id)
    if (!leftNeighbor || !rightNeighbor) {
      return []
    }

    if (leftNeighbor.alignment !== 'good' || rightNeighbor.alignment !== 'good') {
      return []
    }

    const buildModifier = (
      targetPlayerId: string,
      kind: ProtectionModifier['kind'],
    ): ProtectionModifier => ({
      id: `tea_lady:${player.id}:${targetPlayerId}:${kind}`,
      kind,
      sourcePlayerId: player.id,
      targetPlayerId,
      reason: 'Tea Lady protection is active while both alive neighbors are good.',
    })

    return [
      buildModifier(leftNeighbor.id, 'attack_protection'),
      buildModifier(leftNeighbor.id, 'execution_protection'),
      buildModifier(rightNeighbor.id, 'attack_protection'),
      buildModifier(rightNeighbor.id, 'execution_protection'),
    ]
  },
}
