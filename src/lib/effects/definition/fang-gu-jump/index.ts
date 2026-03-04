import { EffectDefinition } from '../../types'
import { IntentHandler, KillIntent } from '../../../pipeline/types'
import { getCurrentTeam } from '../../../identity'
import { buildTransformationStateChanges } from '../../../transformations'

const fangGuJumpHandler: IntentHandler = {
  intentType: 'kill',
  priority: 15,
  appliesTo: (intent, effectPlayer, state) => {
    if (intent.type !== 'kill') return false
    const killIntent = intent as KillIntent
    if (killIntent.sourceId !== effectPlayer.id) return false

    const target = state.players.find((player) => player.id === killIntent.targetId)
    if (!target) return false

    return getCurrentTeam(target) === 'outsider'
  },
  handle: (intent, effectPlayer, state) => {
    const killIntent = intent as KillIntent
    const target = state.players.find((player) => player.id === killIntent.targetId)
    if (!target) {
      return { action: 'allow' }
    }

    const transformation = buildTransformationStateChanges(state, {
      kind: 'role_change',
      source: {
        cause: 'fang_gu_jump',
        playerId: effectPlayer.id,
        roleId: 'fang_gu',
      },
      targets: [
        {
          playerId: target.id,
          newRoleId: 'fang_gu',
          reveal: 'pending',
          includeNewRoleInitialEffects: true,
        },
      ],
    })

    return {
      action: 'redirect',
      newIntent: {
        type: 'kill',
        sourceId: effectPlayer.id,
        targetId: effectPlayer.id,
        cause: 'fang_gu_jump',
      },
      stateChanges: transformation,
    }
  },
}

const definition: EffectDefinition = {
  id: 'fang_gu_jump',
  icon: 'ghost',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  handlers: [fangGuJumpHandler],
}

export default definition
