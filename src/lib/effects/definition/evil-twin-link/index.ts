import { EffectDefinition } from '../../types'
import { WinConditionCheck } from '../../../pipeline/types'

const evilTwinWinCondition: WinConditionCheck = {
  trigger: 'after_execution',
  check: (state, game) => {
    const lastEntry = game.history[game.history.length - 1]
    if (!lastEntry || lastEntry.type !== 'execution') return null
    const executedId = lastEntry.data.playerId as string | undefined
    if (!executedId) return null

    const executedPlayer = state.players.find((player) => player.id === executedId)
    const twinEffect = executedPlayer?.effects.find(
      (effect) => effect.type === 'evil_twin_link',
    )
    if (!twinEffect) return null

    return twinEffect.data?.isEvilTwin === true ? 'townsfolk' : 'demon'
  },
}

const definition: EffectDefinition = {
  id: 'evil_twin_link',
  icon: 'users',
  defaultType: 'passive',
  winConditions: [evilTwinWinCondition],
}

export default definition
