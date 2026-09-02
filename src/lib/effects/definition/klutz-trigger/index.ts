import { EffectDefinition } from '../../types'
import {
  ExecuteIntent,
  IntentHandler,
  KillIntent,
  NominateIntent,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'

const triggerHandler: IntentHandler = {
  intentType: ['execute', 'kill', 'nominate'],
  priority: 20,
  appliesTo: (intent, effectPlayer) => {
    const isExecuteDeath =
      intent.type === 'execute' &&
      (intent as ExecuteIntent).playerId === effectPlayer.id
    const isKillDeath =
      intent.type === 'kill' &&
      (intent as KillIntent).targetId === effectPlayer.id
    const isWitchCursedNominationDeath =
      intent.type === 'nominate' &&
      (intent as NominateIntent).nominatorId === effectPlayer.id &&
      hasEffect(effectPlayer, 'witch_curse')

    return (
      (isExecuteDeath || isKillDeath || isWitchCursedNominationDeath) &&
      !hasEffect(effectPlayer, 'dead') &&
      !hasEffect(effectPlayer, 'klutz_choice_pending')
    )
  },
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
