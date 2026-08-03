import { RoleDefinition, SetupActionProps } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { getCurrentTeam } from '../../../../identity'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { StorytellerChoiceScreen } from '../../../../../components/screens/SectsAndVioletsActionScreens'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('evil_twin', 'en', en)
registerRoleTranslations('evil_twin', 'es', es)

function EvilTwinSetupAction({ player, state, onComplete }: SetupActionProps) {
  const { language } = useI18n()
  const roleT = getRoleTranslations('evil_twin', language)
  const availablePlayers = state.players.filter((candidate) => {
    if (candidate.id === player.id) return false
    const team = getCurrentTeam(candidate)
    return team === 'townsfolk' || team === 'outsider'
  })

  return (
    <StorytellerChoiceScreen
      state={state}
      icon='users'
      title={roleT.setupTitle}
      description={roleT.setupDescription}
      confirmLabel={roleT.setupConfirm}
      players={availablePlayers}
      selectionCount={1}
      onConfirm={(ids) => {
        const counterpartId = ids[0]
        if (!counterpartId) return

        const removeEffects = state.players.reduce<Record<string, string[]>>(
          (result, candidate) => {
            if (candidate.effects.some((effect) => effect.type === 'evil_twin_link')) {
              result[candidate.id] = [
                ...(result[candidate.id] ?? []),
                'evil_twin_link',
                'evil_twin_reveal_pending',
              ]
            }
            return result
          },
          {},
        )

        onComplete({
          removeEffects: Object.keys(removeEffects).length > 0 ? removeEffects : undefined,
          addEffects: {
            [player.id]: [
              {
                type: 'evil_twin_link',
                data: { counterpartId, isEvilTwin: true },
                expiresAt: 'never',
              },
              {
                type: 'evil_twin_reveal_pending',
                data: { counterpartId, isEvilTwin: true },
                expiresAt: 'never',
              },
            ],
            [counterpartId]: [
              {
                type: 'evil_twin_link',
                data: { counterpartId: player.id, isEvilTwin: false },
                expiresAt: 'never',
              },
              {
                type: 'evil_twin_reveal_pending',
                data: { counterpartId: player.id, isEvilTwin: false },
                expiresAt: 'never',
              },
            ],
          },
        })
      }}
    />
  )
}

const definition: RoleDefinition = {
  id: 'evil_twin',
  team: 'minion',
  icon: 'users',
  nightOrder: null,
  chaos: 84,
  shouldWake: (_game, player) => isAlive(player),
  RoleReveal: DefaultRoleReveal,
  NightAction: null,
  SetupAction: EvilTwinSetupAction,
}

export default definition
