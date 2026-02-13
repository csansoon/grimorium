import { EffectDefinition } from '../../types'
import { IntentHandler, NominateIntent } from '../../../pipeline/types'
import { PlayerState } from '../../../types'
import { getRole } from '../../../roles'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('pure', 'en', en)
registerEffectTranslations('pure', 'es', es)

/**
 * Determine a player's actual team.
 *
 * Normally this is just getRole(player.roleId).team. However, effects like
 * Drunk change the player's roleId to a different role (e.g., a Townsfolk)
 * while storing the real role in effect data as `actualRole`. When present,
 * we use the actual role to determine the team instead of the displayed roleId.
 *
 * This avoids importing from the perception/pipeline module (which would
 * create a circular dependency: effects → pipeline → effects).
 */
function getActualTeam(player: PlayerState): string {
  for (const eff of player.effects) {
    const actualRole = eff.data?.actualRole as string | undefined
    if (actualRole) {
      return getRole(actualRole)?.team ?? 'townsfolk'
    }
  }
  return getRole(player.roleId)?.team ?? 'townsfolk'
}

const pureHandler: IntentHandler = {
  intentType: 'nominate',
  priority: 10,
  appliesTo: (intent, effectPlayer) => {
    return (
      intent.type === 'nominate' &&
      (intent as NominateIntent).nomineeId === effectPlayer.id
    )
  },
  handle: (intent, effectPlayer, state) => {
    const nom = intent as NominateIntent
    const nominator = state.players.find((p) => p.id === nom.nominatorId)
    if (!nominator) return { action: 'allow' }

    const isTownsfolk = getActualTeam(nominator) === 'townsfolk'

    if (isTownsfolk) {
      // Townsfolk nominates Virgin → Nominator is executed immediately
      return {
        action: 'prevent',
        reason: 'virgin_triggered',
        stateChanges: {
          entries: [
            {
              type: 'virgin_execution',
              message: [
                {
                  type: 'i18n',
                  key: 'roles.virgin.history.townsfolkExecuted',
                  params: {
                    nominator: nom.nominatorId,
                  },
                },
              ],
              data: {
                nominatorId: nom.nominatorId,
                nomineeId: nom.nomineeId,
                virginTriggered: true,
              },
            },
          ],
          stateUpdates: { phase: 'day' },
          addEffects: {
            [nom.nominatorId]: [
              {
                type: 'dead',
                data: { cause: 'virgin' },
                expiresAt: 'never',
              },
            ],
          },
          removeEffects: {
            [effectPlayer.id]: ['pure'],
          },
        },
      }
    } else {
      // Non-townsfolk nominates Virgin → loses purity, nomination proceeds
      return {
        action: 'allow',
        stateChanges: {
          entries: [
            {
              type: 'virgin_spent',
              message: [
                {
                  type: 'i18n',
                  key: 'roles.virgin.history.lostPurity',
                  params: {
                    nominator: nom.nominatorId,
                  },
                },
              ],
              data: {
                nominatorId: nom.nominatorId,
                nomineeId: nom.nomineeId,
                virginTriggered: false,
              },
            },
          ],
          removeEffects: {
            [effectPlayer.id]: ['pure'],
          },
        },
      }
    }
  },
}

const definition: EffectDefinition = {
  id: 'pure',
  icon: 'flowerLotus',
  defaultType: 'passive',
  handlers: [pureHandler],
}

export default definition
