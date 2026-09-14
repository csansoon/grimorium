import { useMemo, useState } from 'react'
import type { RoleDefinition } from '../../types'
import { isAlive } from '../../../types'
import { isMalfunctioning } from '../../../effects'
import {
  getRoleName,
  getRoleTranslations,
  registerRoleTranslations,
  useI18n,
} from '../../../i18n'
import { getRole } from '../../index'
import { DefaultRoleReveal } from '../../../../components/items/DefaultRoleReveal'
import {
  NightActionLayout,
  NightStepListLayout,
} from '../../../../components/layouts'
import type { NightStep } from '../../../../components/layouts'
import { PlayerPickerList } from '../../../../components/inputs'
import { Button, Icon } from '../../../../components/atoms'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('imp', 'en', en)
registerRoleTranslations('imp', 'es', es)

const definition: RoleDefinition = {
  id: 'imp',
  team: 'demon',
  icon: 'flameKindling',
  nightOrder: 30,
  firstNightOrder: null,
  otherNightOrder: 30,
  chaos: 30,
  shouldWake: (_game, player) => isAlive(player),
  nightSteps: [
    {
      id: 'choose_victim',
      icon: 'flameKindling',
      getLabel: (t) => t.game.stepChooseVictim,
      audience: 'player_choice',
    },
  ],
  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('imp', language)
    const [choosingVictim, setChoosingVictim] = useState(false)
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
    const malfunctioning = isMalfunctioning(player)

    const hasAliveMinions = useMemo(
      () =>
        state.players.some(
          (candidate) =>
            isAlive(candidate) && getRole(candidate.roleId)?.team === 'minion',
        ),
      [state.players],
    )

    if (!choosingVictim) {
      const steps: NightStep[] = [
        {
          id: 'choose_victim',
          icon: 'flameKindling',
          label: t.game.stepChooseVictim,
          status: 'pending',
          audience: 'player_choice',
        },
      ]
      return (
        <NightStepListLayout
          icon='flameKindling'
          roleName={getRoleName('imp', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={() => setChoosingVictim(true)}
        />
      )
    }

    const handleConfirmKill = () => {
      const target = state.players.find(
        (candidate) => candidate.id === selectedTarget,
      )
      if (!target) return

      if (target.id === player.id && hasAliveMinions && !malfunctioning) {
        onComplete({
          entries: [
            {
              type: 'night_action',
              message: [
                {
                  type: 'i18n',
                  key: 'roles.imp.history.selfKilled',
                  params: { player: player.id },
                },
              ],
              data: {
                roleId: 'imp',
                playerId: player.id,
                action: 'self_kill',
              },
            },
          ],
          addEffects: {
            [player.id]: [
              { type: 'imp_starpass_pending', expiresAt: 'end_of_night' },
            ],
          },
          intent: {
            type: 'kill',
            sourceId: player.id,
            targetId: player.id,
            cause: 'imp_self_kill',
          },
        })
        return
      }

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.imp.history.choseToKill',
                params: { player: player.id, target: target.id },
              },
            ],
            data: {
              roleId: 'imp',
              playerId: player.id,
              action: 'kill',
              targetId: target.id,
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
        ...(!malfunctioning && {
          intent: {
            type: 'kill' as const,
            sourceId: player.id,
            targetId: target.id,
            cause: 'demon',
          },
        }),
      })
    }

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={t.game.selectVictim}
        audience='player_choice'
      >
        <div className='mb-6'>
          <PlayerPickerList
            players={state.players}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>

        <Button
          onClick={handleConfirmKill}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='flameKindling' size='md' className='mr-2' />
          {t.game.confirmKill}
        </Button>
      </NightActionLayout>
    )
  },
}

export default definition
