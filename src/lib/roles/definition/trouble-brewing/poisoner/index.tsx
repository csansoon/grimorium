import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import {
  useI18n,
  interpolate,
  registerRoleTranslations,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { NightActionLayout } from '../../../../../components/layouts'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { isAlive } from '../../../../types'
import { canActWhileDeadUnderVigormortis } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('poisoner', 'en', en)
registerRoleTranslations('poisoner', 'es', es)

const definition: RoleDefinition = {
  id: 'poisoner',
  team: 'minion',
  icon: 'flask',
  nightOrder: 5,
  chaos: 45,

  shouldWake: (game, player) =>
    isAlive(player) || canActWhileDeadUnderVigormortis(game, player),

  nightSteps: [
    {
      id: 'choose_target',
      icon: 'flask',
      getLabel: (t) => t.game.stepChooseTarget,
      audience: 'player_choice',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
    const roleT = getRoleTranslations('poisoner', language)

    const alivePlayers = state.players.filter(
      (candidate) => isAlive(candidate) && candidate.id !== player.id,
    )

    const handleConfirm = () => {
      if (!selectedTarget) return

      const target = state.players.find((candidate) => candidate.id === selectedTarget)
      if (!target) return

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.poisoner.history.poisonedPlayer',
                params: {
                  player: player.id,
                  target: target.id,
                },
              },
            ],
            data: {
              roleId: 'poisoner',
              playerId: player.id,
              action: 'poison',
              targetId: target.id,
            },
          },
        ],
        addEffects: {
          [target.id]: [
            {
              type: 'poisoned',
              sourcePlayerId: player.id,
              data: { source: 'poisoner' },
              expiresAt: 'end_of_day',
            },
          ],
        },
      })
    }

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={interpolate(roleT.selectPlayerToPoison, { player: player.name })}
        audience='player_choice'
      >
        <div className='mb-6'>
          <PlayerPickerList
            players={alivePlayers}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='flask' size='md' className='mr-2' />
          {t.common.confirm}
        </Button>
      </NightActionLayout>
    )
  },
}

export default definition
