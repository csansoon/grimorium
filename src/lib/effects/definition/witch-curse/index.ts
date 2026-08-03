import { EffectDefinition } from '../../types'
import { IntentHandler, NominateIntent } from '../../../pipeline/types'

const witchCurseHandler: IntentHandler = {
  intentType: 'nominate',
  priority: 12,
  appliesTo: (intent, effectPlayer) =>
    intent.type === 'nominate' &&
    (intent as NominateIntent).nominatorId === effectPlayer.id,
  handle: (_intent, effectPlayer) => ({
    action: 'allow',
    stateChanges: {
      entries: [
        {
          type: 'execution',
          message: [
            { type: 'text', content: 'Witch curse executed: ' },
            { type: 'player', playerId: effectPlayer.id },
          ],
          data: {
            playerId: effectPlayer.id,
            cause: 'witch',
            witchTriggered: true,
          },
        },
      ],
      addEffects: {
        [effectPlayer.id]: [
          {
            type: 'dead',
            data: { cause: 'witch' },
            expiresAt: 'never',
          },
        ],
      },
      removeEffects: {
        [effectPlayer.id]: ['witch_curse'],
      },
    },
  }),
}

const definition: EffectDefinition = {
  id: 'witch_curse',
  icon: 'sparkles',
  defaultType: 'nerf',
  handlers: [witchCurseHandler],
}

export default definition
