import { EffectDefinition } from '../../types'
import { IntentHandler, KillIntent } from '../../../pipeline/types'
import { StarpassSelectUI } from '../../../../components/items/StarpassSelectUI'
import { isAlive } from '../../../types'
import { getRole } from '../../../roles'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('imp_starpass_pending', 'en', en)
registerEffectTranslations('imp_starpass_pending', 'es', es)

/**
 * Imp Starpass Pending effect handler.
 *
 * Added to the Imp as a direct effect when the Imp chooses to self-kill
 * with alive Minions. The handler runs inside the pipeline after protection
 * handlers (Safe at priority 10) and demon_successor (priority 15).
 *
 * If protection prevents the kill, this handler never runs and the starpass
 * fails. If the kill is allowed, this handler requests UI for the narrator
 * to select which Minion becomes the new Imp.
 *
 * Priority 20: runs after Safe (10) and demon_successor (15). If Safe
 * prevents the kill, the pipeline stops and this handler never executes.
 */
const starpassHandler: IntentHandler = {
  intentType: 'kill',
  priority: 20,
  appliesTo: (intent, effectPlayer) => {
    if (intent.type !== 'kill') return false
    const kill = intent as KillIntent
    return kill.cause === 'imp_self_kill' && kill.targetId === effectPlayer.id
  },
  handle: (_intent, effectPlayer, state) => {
    // Find alive minions
    const aliveMinions = state.players.filter((p) => {
      if (!isAlive(p)) return false
      const role = getRole(p.roleId)
      return role?.team === 'minion'
    })

    // No alive minions — just allow the kill (Imp dies, no starpass)
    if (aliveMinions.length === 0) {
      return { action: 'allow' }
    }

    return {
      action: 'request_ui',
      UIComponent: StarpassSelectUI,
      resume: (selectedNewImpId: unknown) => {
        const newImpId = selectedNewImpId as string
        const newImpPlayer = state.players.find((p) => p.id === newImpId)

        // Clean up effects sourced by the converting Minion (role-agnostic).
        // E.g., if the Poisoner becomes the Imp, poison they applied is removed.
        const sourcedEffectRemovals: Record<string, string[]> = {}
        for (const p of state.players) {
          const sourced = p.effects.filter(
            (e) => e.sourcePlayerId === newImpId,
          )
          if (sourced.length > 0) {
            sourcedEffectRemovals[p.id] = sourced.map((e) => e.type)
          }
        }

        return {
          action: 'allow',
          stateChanges: {
            entries: [
              {
                type: 'role_changed',
                message: [
                  {
                    type: 'i18n',
                    key: 'roles.imp.history.minionBecameImp',
                    params: {
                      player: newImpId,
                    },
                  },
                ],
                data: {
                  playerId: newImpId,
                  fromRole: newImpPlayer?.roleId ?? 'unknown',
                  toRole: 'imp',
                },
              },
            ],
            changeRoles: {
              [newImpId]: 'imp',
            },
            addEffects: {
              [newImpId]: [
                { type: 'pending_role_reveal', expiresAt: 'never' },
              ],
            },
            removeEffects: {
              [effectPlayer.id]: ['imp_starpass_pending'],
              ...sourcedEffectRemovals,
            },
          },
        }
      },
    }
  },
}

const definition: EffectDefinition = {
  id: 'imp_starpass_pending',
  icon: 'sparkles',
  defaultType: 'pending',
  handlers: [starpassHandler],
}

export default definition
