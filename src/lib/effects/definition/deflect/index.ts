import { EffectDefinition } from '../../types'
import { IntentHandler, KillIntent } from '../../../pipeline/types'
import { DeflectRedirectUI } from '../../../../components/items/DeflectRedirectUI'
import { registerEffectTranslations } from '../../../i18n'

import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('deflect', 'en', en)
registerEffectTranslations('deflect', 'es', es)

const deflectHandler: IntentHandler = {
  intentType: 'kill',
  priority: 5, // Before safe (10) — redirect happens before protection check
  appliesTo: (intent, effectPlayer) => {
    return intent.type === 'kill' && intent.targetId === effectPlayer.id
  },
  handle: (intent, effectPlayer) => {
    const kill = intent as KillIntent
    return {
      action: 'request_ui',
      UIComponent: DeflectRedirectUI,
      resume: (newTargetId: unknown) => {
        const targetId = newTargetId as string

        if (targetId === effectPlayer.id) {
          // Narrator chose the original target — ignore deflect
          return { action: 'allow' }
        }

        // Redirect the kill to the new target
        return {
          action: 'redirect',
          newIntent: { ...kill, targetId },
          stateChanges: {
            entries: [
              {
                type: 'night_action',
                message: [
                  {
                    type: 'i18n',
                    key: 'roles.imp.history.deflectRedirected',
                    params: {
                      player: kill.sourceId,
                      target: effectPlayer.id,
                      redirect: targetId,
                    },
                  },
                ],
                data: {
                  action: 'kill_redirected',
                  sourceId: kill.sourceId,
                  originalTargetId: effectPlayer.id,
                  redirectTargetId: targetId,
                },
              },
            ],
          },
        }
      },
    }
  },
}

const definition: EffectDefinition = {
  id: 'deflect',
  icon: 'trendingUpDown',
  defaultType: 'buff',
  handlers: [deflectHandler],
}

export default definition
