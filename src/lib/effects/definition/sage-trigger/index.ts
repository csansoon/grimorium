import { EffectDefinition } from '../../types'
import { IntentHandler, KillIntent } from '../../../pipeline/types'
import { hasEffect } from '../../../types'
import { getCurrentTeam } from '../../../identity'

const triggerHandler: IntentHandler = {
  intentType: 'kill',
  priority: 20,
  appliesTo: (intent, effectPlayer, state) => {
    if (intent.type !== 'kill') return false
    if ((intent as KillIntent).targetId !== effectPlayer.id) return false
    if (hasEffect(effectPlayer, 'sage_pending')) return false

    const source = state.players.find((player) => player.id === intent.sourceId)
    return source ? getCurrentTeam(source) === 'demon' : false
  },
  handle: (intent, effectPlayer) => ({
    action: 'allow',
    stateChanges: {
      entries: [],
      addEffects: {
        [effectPlayer.id]: [
          {
            type: 'sage_pending',
            expiresAt: 'never',
            data: { demonId: (intent as KillIntent).sourceId },
          },
        ],
      },
    },
  }),
}

const definition: EffectDefinition = {
  id: 'sage_trigger',
  icon: 'bookUser',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  handlers: [triggerHandler],
}

export default definition
