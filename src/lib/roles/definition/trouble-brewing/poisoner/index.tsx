import { useState } from 'react'
import type { NightActionResult, RoleDefinition } from '../../../types'
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
import type { PlayerState } from '../../../../types'
import { isMalfunctioning } from '../../../../effects'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('poisoner', 'en', en)
registerRoleTranslations('poisoner', 'es', es)

export function createPoisonResult(
  player: PlayerState,
  target: PlayerState,
): NightActionResult {
  const malfunctioning = isMalfunctioning(player)

  return {
    entries: [
      {
        type: 'night_action',
        message: [
          {
            type: 'i18n',
            key: 'roles.poisoner.history.poisonedPlayer',
            params: { player: player.id, target: target.id },
          },
        ],
        data: {
          roleId: 'poisoner',
          playerId: player.id,
          action: 'poison',
          targetId: target.id,
          ...(malfunctioning ? { malfunctioned: true } : {}),
        },
      },
    ],
    addEffects: malfunctioning
      ? undefined
      : {
          [target.id]: [
            {
              type: 'poisoned',
              sourcePlayerId: player.id,
              data: { source: 'poisoner' },
              expiresAt: 'end_of_day',
            },
          ],
        },
  }
}

const definition: RoleDefinition = {
  id: 'poisoner',
  team: 'minion',
  icon: 'flask',
  nightOrder: 10,
  firstNightOrder: 10,
  otherNightOrder: 10,
  chaos: 45,
  shouldWake: (_game, player) => isAlive(player),
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
    const [choosingTarget, setChoosingTarget] = useState(false)
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
    const roleT = getRoleTranslations('poisoner', language)

    if (!choosingTarget) {
      const steps: NightStep[] = [
        {
          id: 'choose_target',
          icon: 'flask',
          label: t.game.stepChooseTarget,
          status: 'pending',
          audience: 'player_choice',
        },
      ]
      return (
        <NightStepListLayout
          icon='flask'
          roleName={getRoleName('poisoner', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={() => setChoosingTarget(true)}
        />
      )
    }

    const handleConfirm = () => {
      const target = state.players.find(
        (candidate) => candidate.id === selectedTarget,
      )
      if (target) onComplete(createPoisonResult(player, target))
    }

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={interpolate(roleT.selectPlayerToPoison, {
          player: player.name,
        })}
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
