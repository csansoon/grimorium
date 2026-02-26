import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import {
  useI18n,
  interpolate,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  NightActionLayout,
  NightStepListLayout,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { isAlive } from '../../../../types'
import { isMalfunctioning } from '../../../../effects'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('monk', 'en', en)
registerRoleTranslations('monk', 'es', es)

const definition: RoleDefinition = {
  id: 'monk',
  team: 'townsfolk',
  icon: 'church',
  nightOrder: 20, // Monk wakes before the Demon
  chaos: 25,
  shouldWake: (game, player) =>
    isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

  nightSteps: [
    {
      id: 'choose_player',
      icon: 'shield',
      getLabel: (t) => t.game.stepChoosePlayer,
      audience: 'player_choice',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<'step_list' | 'choose_player'>(
      'step_list',
    )
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

    const roleT = getRoleTranslations('monk', language)

    // Can only protect other alive players (not themselves)
    const otherAlivePlayers = state.players.filter(
      (p) => isAlive(p) && p.id !== player.id,
    )

    const malfunctioning = isMalfunctioning(player)

    const handleConfirm = () => {
      if (!selectedTarget) return

      const target = state.players.find((p) => p.id === selectedTarget)
      if (!target) return

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.monk.history.protectedPlayer',
                params: {
                  player: player.id,
                  target: target.id,
                },
              },
            ],
            data: {
              roleId: 'monk',
              playerId: player.id,
              action: 'protect',
              targetId: target.id,
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
        // When malfunctioning, the safe effect is NOT applied
        ...(!malfunctioning && {
          addEffects: {
            [target.id]: [
              {
                type: 'safe',
                data: { source: 'monk' },
                expiresAt: 'end_of_night',
              },
            ],
          },
        }),
      })
    }

    // Step List Phase
    if (phase === 'step_list') {
      const steps: NightStep[] = [
        {
          id: 'choose_player',
          icon: 'shield',
          label: t.game.stepChoosePlayer,
          status: 'pending',
          audience: 'player_choice' as const,
        },
      ]

      return (
        <NightStepListLayout
          icon='church'
          roleName={getRoleName('monk', language)}
          playerName={player.name}
          steps={steps}
          onSelectStep={() => setPhase('choose_player')}
        />
      )
    }

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={interpolate(roleT.selectPlayerToProtect, { player: player.name })}
        audience="player_choice"
      >
        <div className='mb-6'>
          <PlayerPickerList
            players={otherAlivePlayers}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='blue'
          />
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='night'
        >
          <Icon name='shield' size='md' className='mr-2' />
          {t.common.confirm}
        </Button>
      </NightActionLayout>
    )
  },
}

export default definition
