import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import {
  useI18n,
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

registerRoleTranslations('butler', 'en', en)
registerRoleTranslations('butler', 'es', es)

/**
 * The Butler — Outsider role.
 *
 * Each night, choose a player (not yourself): tomorrow, you may only
 * vote if they are voting too. The chosen player is your "master".
 *
 * The voting restriction is tracked via the `butler_master` effect on
 * the Butler, with `data.masterId` pointing to the chosen master.
 * The VotingPhase UI displays this visually for the narrator to enforce.
 *
 * When malfunctioning (poisoned/drunk), the Butler still picks a master
 * (to maintain the charade), but the effect is NOT applied — the Butler
 * can vote freely during the day.
 */
const definition: RoleDefinition = {
  id: 'butler',
  team: 'outsider',
  icon: 'handHeart',
  nightOrder: 35, // Late — the Butler's choice doesn't interact with other night abilities

  nightSteps: [
    {
      id: 'choose_master',
      icon: 'handHeart',
      getLabel: (t) => t.game.stepChooseMaster,
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<'step_list' | 'choose_master'>(
      'step_list',
    )
    const [selectedMaster, setSelectedMaster] = useState<string | null>(null)

    const roleT = getRoleTranslations('butler', language)

    // Can choose any alive player except themselves
    const otherAlivePlayers = state.players.filter(
      (p) => isAlive(p) && p.id !== player.id,
    )

    const malfunctioning = isMalfunctioning(player)

    const handleConfirm = () => {
      if (!selectedMaster) return

      const master = state.players.find((p) => p.id === selectedMaster)
      if (!master) return

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.butler.history.choseMaster',
                params: {
                  player: player.id,
                  target: master.id,
                },
              },
            ],
            data: {
              roleId: 'butler',
              playerId: player.id,
              action: 'choose_master',
              masterId: master.id,
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
        // Remove any previous butler_master effect, then add new one
        // When malfunctioning, the effect is NOT applied
        removeEffects: {
          [player.id]: ['butler_master'],
        },
        ...(!malfunctioning && {
          addEffects: {
            [player.id]: [
              {
                type: 'butler_master',
                data: { masterId: master.id },
                expiresAt: 'never',
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
          id: 'choose_master',
          icon: 'handHeart',
          label: t.game.stepChooseMaster,
          status: 'pending',
        },
      ]

      return (
        <NightStepListLayout
          icon='handHeart'
          roleName={getRoleName('butler', language)}
          playerName={player.name}
          steps={steps}
          onSelectStep={() => setPhase('choose_master')}
        />
      )
    }

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={roleT.selectPlayerAsMaster}
      >
        <div className='mb-6'>
          <PlayerPickerList
            players={otherAlivePlayers}
            selected={selectedMaster ? [selectedMaster] : []}
            onSelect={setSelectedMaster}
            selectionCount={1}
            variant='blue'
          />
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selectedMaster}
          fullWidth
          size='lg'
          variant='night'
        >
          <Icon name='handHeart' size='md' className='mr-2' />
          {t.common.iUnderstandMyRole}
        </Button>
      </NightActionLayout>
    )
  },
}

export default definition
