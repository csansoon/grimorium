import { EffectDefinition } from '../../types'
import {
  IntentHandler,
  KillIntent,
  ExecuteIntent,
} from '../../../pipeline/types'
import { getRole } from '../../../roles'
import { hasEffect, getAlivePlayers } from '../../../types'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('demon_successor', 'en', en)
registerEffectTranslations('demon_successor', 'es', es)

/**
 * Demon Successor effect handler.
 *
 * When the Demon dies (via kill or execution) and there are 5 or more
 * alive non-Traveller players, the player with this effect becomes the Demon.
 * The handler allows the kill/execution to proceed but piggybacks
 * a role change onto the state changes.
 *
 * Priority 15: runs AFTER protection handlers (Safe at 10) so that
 * if the kill is prevented, this handler never executes. If the kill
 * is allowed, the successor transforms.
 */
const demonSuccessorHandler: IntentHandler = {
  intentType: ['kill', 'execute'],
  priority: 15,
  appliesTo: (intent, effectPlayer, state) => {
    // Skip for voluntary Imp self-kill starpass — the narrator manually
    // chooses who becomes the new Imp via the starpass handler.
    if (
      intent.type === 'kill' &&
      (intent as KillIntent).cause === 'imp_self_kill'
    )
      return false

    // Get the target of the intent
    let targetId: string
    if (intent.type === 'kill') {
      targetId = (intent as KillIntent).targetId
    } else if (intent.type === 'execute') {
      targetId = (intent as ExecuteIntent).playerId
    } else {
      return false
    }

    // The target must be a Demon
    const target = state.players.find((p) => p.id === targetId)
    if (!target) return false
    const targetRole = getRole(target.roleId)
    if (targetRole?.team !== 'demon') return false

    // The successor (effect holder) must be alive
    if (hasEffect(effectPlayer, 'dead')) return false

    // The successor must not be the target themselves
    if (effectPlayer.id === targetId) return false

    // 5+ alive players (Travellers don't count — none exist yet)
    const aliveCount = getAlivePlayers(state).length
    return aliveCount >= 5
  },
  handle: (intent, effectPlayer, state) => {
    // Determine the demon's role so the successor inherits it
    let targetId: string
    if (intent.type === 'kill') {
      targetId = (intent as KillIntent).targetId
    } else {
      targetId = (intent as ExecuteIntent).playerId
    }

    const target = state.players.find((p) => p.id === targetId)!

    return {
      action: 'allow',
      stateChanges: {
        entries: [
          {
            type: 'role_changed',
            message: [
              {
                type: 'i18n',
                key: 'roles.scarlet_woman.history.becameDemon',
                params: {
                  player: effectPlayer.id,
                  role: target.roleId,
                },
              },
            ],
            data: {
              playerId: effectPlayer.id,
              fromRole: effectPlayer.roleId,
              toRole: target.roleId,
            },
          },
        ],
        changeRoles: {
          [effectPlayer.id]: target.roleId,
        },
        addEffects: {
          [effectPlayer.id]: [
            { type: 'pending_role_reveal', expiresAt: 'never' },
          ],
        },
        removeEffects: {
          [effectPlayer.id]: ['demon_successor'],
        },
      },
    }
  },
}

const definition: EffectDefinition = {
  id: 'demon_successor',
  icon: 'crown',
  defaultType: 'passive',
  handlers: [demonSuccessorHandler],
}

export default definition
