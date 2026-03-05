import { EffectDefinition } from '../../types'
import { ExecuteIntent, IntentHandler } from '../../../pipeline/types'
import { hasEffect } from '../../../types'

const triggerHandler: IntentHandler = {
  intentType: 'execute',
  priority: 20,
  appliesTo: (intent, effectPlayer) =>
    intent.type === 'execute' &&
    (intent as ExecuteIntent).playerId === effectPlayer.id &&
    !hasEffect(effectPlayer, 'klutz_choice_pending'),
  handle: (_intent, effectPlayer) => ({
    action: 'allow',
    stateChanges: {
      entries: [],
      addEffects: {
        [effectPlayer.id]: [
          { type: 'klutz_choice_pending', expiresAt: 'never' },
        ],
      },
    },
  }),
}

const definition: EffectDefinition = {
  id: 'klutz_trigger',
  icon: 'drama',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  handlers: [triggerHandler],
}

export default definition
