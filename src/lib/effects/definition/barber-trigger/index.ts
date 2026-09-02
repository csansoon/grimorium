import { EffectDefinition } from '../../types'
import {
  ExecuteIntent,
  IntentHandler,
  KillIntent,
  NominateIntent,
} from '../../../pipeline/types'
import { hasEffect, isAlive } from '../../../types'
import { getCurrentRoleTeam } from '../../../identity'

const triggerHandler: IntentHandler = {
  intentType: ['kill', 'execute', 'nominate'],
  priority: 20,
  appliesTo: (intent, effectPlayer, state) => {
    const targetId =
      intent.type === 'kill'
        ? (intent as KillIntent).targetId
        : intent.type === 'execute'
          ? (intent as ExecuteIntent).playerId
          : (intent as NominateIntent).nominatorId

    const hasAliveEvilDemon = state.players.some(
      (player) => isAlive(player) && getCurrentRoleTeam(player) === 'demon',
    )
    const witchCursedNominationDeath =
      intent.type === 'nominate' && hasEffect(effectPlayer, 'witch_curse')

    return (
      targetId === effectPlayer.id &&
      (intent.type !== 'nominate' || witchCursedNominationDeath) &&
      hasAliveEvilDemon &&
      !state.players.some((player) => hasEffect(player, 'barber_swap_pending'))
    )
  },
  handle: (_intent, effectPlayer, state) => {
    const demon = state.players.find(
      (player) => isAlive(player) && getCurrentRoleTeam(player) === 'demon',
    )

    if (!demon) return { action: 'allow' }

    return {
      action: 'allow',
      stateChanges: {
        entries: [],
        addEffects: {
          [demon.id]: [
            {
              type: 'barber_swap_pending',
              expiresAt: 'never',
              data: { barberId: effectPlayer.id },
            },
          ],
        },
      },
    }
  },
}

const definition: EffectDefinition = {
  id: 'barber_trigger',
  icon: 'shuffle',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  handlers: [triggerHandler],
}

export default definition
