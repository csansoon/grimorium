import { RoleDefinition } from '../../../types'
import { hasEffect, isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { StorytellerChoiceScreen } from '../../../../../components/screens/SectsAndVioletsActionScreens'
import { canActWhileDeadUnderVigormortis } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('witch', 'en', en)
registerRoleTranslations('witch', 'es', es)

const definition: RoleDefinition = {
  id: 'witch',
  team: 'minion',
  icon: 'sparkles',
  nightOrder: 6,
  chaos: 56,
  shouldWake: (game, player) =>
    isAlive(player) || canActWhileDeadUnderVigormortis(game, player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('witch', language)
    const selectablePlayers = state.players.filter((candidate) => candidate.id !== player.id)
    const aliveIds = selectablePlayers
      .filter((candidate) => !hasEffect(candidate, 'dead'))
      .map((candidate) => candidate.id)
    const deadIds = selectablePlayers
      .filter((candidate) => hasEffect(candidate, 'dead'))
      .map((candidate) => candidate.id)
    const groups = [
      { label: 'Alive', playerIds: aliveIds },
      { label: 'Dead', playerIds: deadIds },
    ].filter((group) => group.playerIds.length > 0)

    return (
      <StorytellerChoiceScreen
        state={state}
        icon='sparkles'
        title={roleT.chooseTargetTitle}
        description={roleT.chooseTargetDescription}
        confirmLabel={roleT.confirmChoiceLabel}
        players={selectablePlayers}
        groups={groups}
        selectionCount={1}
        onConfirm={(ids) => {
          const targetId = ids[0]
          if (!targetId) return
          onComplete({
            entries: [
              {
                type: 'night_action',
                message: [
                  { type: 'text', content: `${player.name} cursed ` },
                  { type: 'player', playerId: targetId },
                ],
                data: {
                  roleId: 'witch',
                  playerId: player.id,
                  action: 'witch_curse',
                  targetId,
                },
              },
            ],
            addEffects: {
              [targetId]: [
                {
                  type: 'witch_curse',
                  data: { witchId: player.id },
                  expiresAt: 'end_of_day',
                },
              ],
            },
          })
        }}
      />
    )
  },
}

export default definition
