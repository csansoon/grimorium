import { createStorytellerChoiceIntent } from '../../intents'
import { getPlayer, type EngineState } from '../../state'
import { playerHasMalfunction } from './constrainedStorytellerInfo'
import type { EngineRoleDefinition } from '../types'

function getPairChoiceLabels(
  state: EngineState,
  pairIds: string[],
): Record<string, string> {
  return Object.fromEntries(
    pairIds.map((pairId) => {
      const [firstPlayerId, secondPlayerId] = pairId.split('|')
      const firstLabel = firstPlayerId
        ? getPlayer(state, firstPlayerId)?.name ?? firstPlayerId
        : ''
      const secondLabel = secondPlayerId
        ? getPlayer(state, secondPlayerId)?.name ?? secondPlayerId
        : ''
      return [pairId, `${firstLabel} + ${secondLabel}`]
    }),
  )
}

function getPairIds(playerIds: string[]): string[] {
  const pairs: string[] = []

  for (let firstIndex = 0; firstIndex < playerIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < playerIds.length; secondIndex += 1) {
      const first = playerIds[firstIndex]
      const second = playerIds[secondIndex]
      if (first && second) {
        pairs.push(`${first}|${second}`)
      }
    }
  }

  return pairs
}

function createSagePairChoice(
  state: EngineState,
  playerId: string,
  sourceRoleId: string,
  actualDemonPlayerId: string,
) {
  const visibleCandidates = state.players
    .filter((candidate) => candidate.id !== playerId)
    .map((candidate) => candidate.id)

  const malfunctioning = playerHasMalfunction(state, playerId)
  const candidatePairIds = malfunctioning
    ? getPairIds(visibleCandidates)
    : visibleCandidates
        .filter((candidateId) => candidateId !== actualDemonPlayerId)
        .map((candidateId) => `${actualDemonPlayerId}|${candidateId}`)

  if (candidatePairIds.length === 0) {
    return state
  }

  return createStorytellerChoiceIntent({
    id: `sage:${playerId}:demon-pair`,
    resolutionMode: 'choice_required',
    title: malfunctioning ? 'Choose Sage shown players' : 'Choose Sage decoy player',
    message: malfunctioning
      ? 'This ability is malfunctioning. Choose any two players to show.'
      : 'Choose the decoy player to show alongside the Demon.',
    sourcePlayerId: playerId,
    sourceRoleId,
    candidatePlayerIds: candidatePairIds,
    candidateLabels: getPairChoiceLabels(state, candidatePairIds),
    onResolve: [
      {
        kind: 'queue_information_from_selection',
        packet: {
          audience: 'player',
          playerId,
          title: 'Sage',
          summary: malfunctioning
            ? 'Storyteller-selected malfunction result.'
            : 'One of these players is the Demon.',
          sourcePlayerId: playerId,
          sourceRoleId,
        },
        fragments: [
          { kind: 'text', text: 'One of these players is the Demon: ' },
          { kind: 'selected_player_pair_first' },
          { kind: 'text', text: ' or ' },
          { kind: 'selected_player_pair_second' },
          { kind: 'text', text: '.' },
        ],
      },
    ],
  })
}

export const sageRole: EngineRoleDefinition = {
  id: 'sage',
  roleTeam: 'townsfolk',
  shouldQueueNightAction: () => false,
  getRoleTriggers: ({ player }) => [
    {
      id: `${player.id}:sage-killed-by-demon`,
      event: 'onPlayerDied' as const,
      scope: { subject: 'self' as const },
      when: (_ctx, occurrence) =>
        occurrence.subject.kind === 'player' &&
        occurrence.subject.cause === 'demon_attack' &&
        (occurrence.subject.phase === 'first_night' ||
          occurrence.subject.phase === 'other_night') &&
        occurrence.engineEvent?.type === 'player_died' &&
        typeof occurrence.engineEvent?.intent.sourcePlayerId === 'string',
      handle: ({ state, player: currentPlayer }, occurrence) =>
        createSagePairChoice(
          state,
          currentPlayer.id,
          currentPlayer.roleId,
          occurrence.engineEvent?.type === 'player_died'
            ? occurrence.engineEvent.intent.sourcePlayerId as string
            : '',
        ),
    },
  ],
}
