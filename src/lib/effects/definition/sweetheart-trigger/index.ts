import { EffectDefinition } from '../../types'
import {
  ExecuteIntent,
  IntentHandler,
  KillIntent,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'

const triggerHandler: IntentHandler = {
  intentType: ['kill', 'execute'],
  priority: 20,
  appliesTo: (intent, effectPlayer) => {
    const targetId =
      intent.type === 'kill'
        ? (intent as KillIntent).targetId
        : (intent as ExecuteIntent).playerId

    return (
      targetId === effectPlayer.id &&
      !hasEffect(effectPlayer, 'sweetheart_pending')
    )
  },
  handle: (_intent, effectPlayer) => ({
    action: 'allow',
    stateChanges: {
      entries: [],
      addEffects: {
        [effectPlayer.id]: [{ type: 'sweetheart_pending', expiresAt: 'never' }],
      },
    },
  }),
}

const definition: EffectDefinition = {
  id: 'sweetheart_trigger',
  icon: 'handHeart',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  handlers: [triggerHandler],
}

export default definition
