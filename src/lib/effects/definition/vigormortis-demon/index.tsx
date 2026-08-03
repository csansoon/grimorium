import { EffectDefinition } from '../../types'
import { IntentHandler, KillIntent, PipelineInputProps } from '../../../pipeline/types'
import { getCurrentTeam } from '../../../identity'
import { GameState, PlayerState, isAlive } from '../../../types'
import { StorytellerChoiceScreen } from '../../../../components/screens/SectsAndVioletsActionScreens'

function getClosestAliveTownsfolkChoices(
  state: GameState,
  sourceId: string,
): PlayerState[] {
  const sourceIndex = state.players.findIndex((player) => player.id === sourceId)
  if (sourceIndex === -1) return []

  const isAliveTownsfolk = (player: PlayerState) =>
    isAlive(player) && getCurrentTeam(player) === 'townsfolk'

  let leftDistance: number | null = null
  let rightDistance: number | null = null
  let leftPlayer: PlayerState | null = null
  let rightPlayer: PlayerState | null = null

  for (let step = 1; step < state.players.length; step++) {
    const leftIndex =
      (sourceIndex - step + state.players.length) % state.players.length
    const leftCandidate = state.players[leftIndex]
    if (leftDistance == null && isAliveTownsfolk(leftCandidate)) {
      leftDistance = step
      leftPlayer = leftCandidate
    }

    const rightIndex = (sourceIndex + step) % state.players.length
    const rightCandidate = state.players[rightIndex]
    if (rightDistance == null && isAliveTownsfolk(rightCandidate)) {
      rightDistance = step
      rightPlayer = rightCandidate
    }

    if (leftDistance != null && rightDistance != null) break
  }

  if (leftDistance == null && rightDistance == null) return []
  if (leftDistance == null) return rightPlayer ? [rightPlayer] : []
  if (rightDistance == null) return leftPlayer ? [leftPlayer] : []
  if (leftDistance < rightDistance) return leftPlayer ? [leftPlayer] : []
  if (rightDistance < leftDistance) return rightPlayer ? [rightPlayer] : []

  return [leftPlayer, rightPlayer].filter(Boolean) as PlayerState[]
}

function buildMarkerStateChanges(targetId: string, chosenNeighborId?: string) {
  return {
    entries: [],
    addEffects: {
      [targetId]: [
        {
          type: 'vigormortis_killed',
          data: chosenNeighborId ? { chosenNeighborId } : undefined,
          expiresAt: 'never' as const,
        },
      ],
    },
  }
}

const handler: IntentHandler = {
  intentType: 'kill',
  priority: 15,
  appliesTo: (intent, effectPlayer, state) => {
    if (intent.type !== 'kill') return false
    const killIntent = intent as KillIntent
    if (killIntent.sourceId !== effectPlayer.id) return false

    const target = state.players.find((player) => player.id === killIntent.targetId)
    if (!target) return false

    return getCurrentTeam(target) === 'minion'
  },
  handle: (intent, _effectPlayer, state) => {
    const killIntent = intent as KillIntent
    const choices = getClosestAliveTownsfolkChoices(state, killIntent.targetId)

    if (choices.length <= 1) {
      return {
        action: 'allow',
        stateChanges: buildMarkerStateChanges(
          killIntent.targetId,
          choices[0]?.id,
        ),
      }
    }

    const ChoiceUI = ({ state, onComplete }: PipelineInputProps) => (
      <StorytellerChoiceScreen
        state={state}
        icon='crown'
        title='Vigormortis'
        description='Choose which closest alive Townsfolk neighbor the dead Minion will poison.'
        confirmLabel='Set poisoned neighbor'
        players={choices}
        onConfirm={([selectedId]) => onComplete(selectedId)}
      />
    )

    return {
      action: 'request_ui',
      UIComponent: ChoiceUI,
      resume: (result) => ({
        action: 'allow',
        stateChanges: buildMarkerStateChanges(
          killIntent.targetId,
          typeof result === 'string' ? result : undefined,
        ),
      }),
    }
  },
}

const definition: EffectDefinition = {
  id: 'vigormortis_demon',
  icon: 'crown',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  handlers: [handler],
}

export default definition
