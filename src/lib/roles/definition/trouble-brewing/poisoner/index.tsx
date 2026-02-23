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
  HandbackButton,
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
 * First night: Shown the evil team (other Minions + Demon), then
 * chooses a player to poison. The poison is active from Night 1,
 * which is crucial — it can make info roles give wrong results.
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
      audience: 'player_choice',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
    const [showEvilTeamDone, setShowEvilTeamDone] = useState(false)

    const isFirstNight = state.round === 1
    const roleT = getRoleTranslations('poisoner', language)

    const alivePlayers = state.players.filter(
      (p) => isAlive(p) && p.id !== player.id,
    )

    const handleConfirm = () => {
      if (!selectedTarget) return

      const target = state.players.find((p) => p.id === selectedTarget)
      if (!target) return

      const entries = []

      // On first night, include the evil team reveal history entry
      if (isFirstNight) {
        entries.push({
          type: 'night_action' as const,
          message: [
            {
              type: 'i18n' as const,
              key: 'roles.poisoner.history.shownEvilTeam',
              params: { player: player.id },
            },
          ],
          data: {
            roleId: 'poisoner',
            playerId: player.id,
            action: 'first_night_info',
          },
        })
      }

      entries.push({
        type: 'night_action' as const,
        message: [
          {
            type: 'i18n' as const,
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
      })

      onComplete({
        entries,
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
          status: showEvilTeamDone ? 'done' : 'pending',
          audience: 'player_reveal' as const,
        })
      }

      steps.push({
        id: 'choose_target',
        icon: 'flask',
        label: t.game.stepChooseTarget,
        status: 'pending',
        audience: 'player_choice' as const,
      })

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

            <HandbackButton
              onClick={() => {
                setShowEvilTeamDone(true)
                setPhase('step_list')
              }}
              fullWidth
              size='lg'
              variant='evil'
            >
              <Icon name='check' size='md' className='mr-2' />
              {t.common.iUnderstandMyRole}
            </HandbackButton>
          </NightActionLayout>
        </PlayerFacingScreen>
      )
    }

    // ================================================================
    // RENDER: Choose Target (every night)
    // ================================================================

    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={roleT.selectPlayerToPoison}
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
