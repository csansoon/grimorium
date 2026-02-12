import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { EvilTeamReveal } from '../../../../../components/items/EvilTeamReveal'
import {
  NightActionLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { isAlive } from '../../../../types'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('poisoner', 'en', en)
registerRoleTranslations('poisoner', 'es', es)

type Phase = 'step_list' | 'show_evil_team' | 'choose_target'

/**
 * The Poisoner — Minion role.
 *
 * First night: Shown the evil team (other Minions + Demon).
 * No poison action on the first night.
 *
 * Subsequent nights: chooses a player to poison.
 * The poisoned effect expires at "end_of_day" — it lasts through
 * the current night AND the following day, affecting both night
 * abilities and day-phase abilities (Slayer, win conditions, etc.).
 * It is removed when the next night starts.
 */
const definition: RoleDefinition = {
  id: 'poisoner',
  team: 'minion',
  icon: 'flask',
  nightOrder: 5, // Very early — before all info roles
  chaos: 45,

  shouldWake: (_game, player) => isAlive(player),

  nightSteps: [
    {
      id: 'show_evil_team',
      icon: 'swords',
      getLabel: (t) => t.game.stepShowEvilTeam,
      condition: (_game, _player, state) => state.round === 1,
      audience: 'player_reveal',
    },
    {
      id: 'choose_target',
      icon: 'flask',
      getLabel: (t) => t.game.stepChooseTarget,
      condition: (_game, _player, state) => state.round > 1,
      audience: 'player_choice',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

    const isFirstNight = state.round === 1
    const roleT = getRoleTranslations('poisoner', language)

    const alivePlayers = state.players.filter(
      (p) => isAlive(p) && p.id !== player.id,
    )

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
              data: { source: 'poisoner' },
              expiresAt: 'end_of_day',
            },
          ],
        },
      })
    }

    const handleFirstNightComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.poisoner.history.shownEvilTeam',
                params: { player: player.id },
              },
            ],
            data: {
              roleId: 'poisoner',
              playerId: player.id,
              action: 'first_night_info',
            },
          },
        ],
      })
    }

    // ================================================================
    // Step List Phase
    // ================================================================

    if (phase === 'step_list') {
      const steps: NightStep[] = []

      if (isFirstNight) {
        steps.push({
          id: 'show_evil_team',
          icon: 'swords',
          label: t.game.stepShowEvilTeam,
          status: 'pending',
          audience: 'player_reveal' as const,
        })
      } else {
        steps.push({
          id: 'choose_target',
          icon: 'flask',
          label: t.game.stepChooseTarget,
          status: 'pending',
          audience: 'player_choice' as const,
        })
      }

      return (
        <NightStepListLayout
          icon='flask'
          roleName={getRoleName('poisoner', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={(stepId) => setPhase(stepId as Phase)}
        />
      )
    }

    // ================================================================
    // RENDER: Show Evil Team (first night, player-facing)
    // ================================================================

    if (phase === 'show_evil_team') {
      return (
        <PlayerFacingScreen playerName={player.name}>
          <NightActionLayout
            player={player}
            title={roleT.evilTeamTitle}
            description={roleT.evilTeamDescription}
          >
            <div className='mb-6'>
              <EvilTeamReveal
                state={state}
                viewer={player}
                viewerType='minion'
              />
            </div>

            <Button
              onClick={handleFirstNightComplete}
              fullWidth
              size='lg'
              variant='evil'
            >
              <Icon name='check' size='md' className='mr-2' />
              {t.common.iUnderstandMyRole}
            </Button>
          </NightActionLayout>
        </PlayerFacingScreen>
      )
    }

    // ================================================================
    // RENDER: Choose Target (subsequent nights)
    // ================================================================

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={roleT.selectPlayerToPoison}
        audience="player_choice"
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
