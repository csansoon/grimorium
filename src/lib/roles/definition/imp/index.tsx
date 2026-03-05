import { useMemo, useState } from 'react'
import { RoleDefinition, NightActionProps } from '../../types'
import { isAlive } from '../../../types'
import { isMalfunctioning } from '../../../effects'
import {
  useI18n,
  interpolate,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../i18n'
import { getRole, getRolesForGame } from '../../index'
import { isGoodTeam } from '../../../teams'
import { DefaultRoleReveal } from '../../../../components/items/DefaultRoleReveal'
import {
  NightActionLayout,
  NarratorSetupLayout,
  NightStepListLayout,
} from '../../../../components/layouts'
import type { NightStep } from '../../../../components/layouts'
import { PlayerPickerList, RolePickerGrid } from '../../../../components/inputs'
import { StepSection } from '../../../../components/items'
import { Button, Icon } from '../../../../components/atoms'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('imp', 'en', en)
registerRoleTranslations('imp', 'es', es)

type Phase = 'step_list' | 'select_bluffs' | 'choose_victim'

const definition: RoleDefinition = {
  id: 'imp',
  team: 'demon',
  icon: 'flameKindling',
  nightOrder: 30,
  chaos: 30,
  shouldWake: (game, player) => {
    if (!isAlive(player)) return false
    const state = game.history.at(-1)?.stateAfter
    return (state?.round ?? 0) > 1
  },

  nightSteps: [
    {
      id: 'choose_victim',
      icon: 'flameKindling',
      getLabel: (t) => t.game.stepChooseVictim,
      condition: (_game, _player, state) => state.round > 1,
      audience: 'player_choice',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({
    game,
    state,
    player,
    onComplete,
    mode = 'night',
  }: NightActionProps & { mode?: 'night' | 'prepare' }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('imp', language)
    const [phase, setPhase] = useState<Phase>(() =>
      mode === 'prepare' ? 'select_bluffs' : 'step_list',
    )
    const [selectedBluffs, setSelectedBluffs] = useState<string[]>([])
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

    const alivePlayers = state.players.filter((candidate) => isAlive(candidate))
    const malfunctioning = isMalfunctioning(player)
    const goodRolesNotInPlay = useMemo(() => {
      const rolesInPlay = new Set(state.players.map((candidate) => candidate.roleId))
      return getRolesForGame(game).filter(
        (candidate) =>
          isGoodTeam(candidate.team) &&
          !rolesInPlay.has(candidate.id),
      )
    }, [game, state.players])

    const hasAliveMinions = useMemo(
      () =>
        state.players.some((candidate) => {
          if (!isAlive(candidate)) return false
          return getRole(candidate.roleId)?.team === 'minion'
        }),
      [state.players],
    )

    const handleBluffToggle = (roleId: string) => {
      setSelectedBluffs((prev) => {
        if (prev.includes(roleId)) return prev.filter((id) => id !== roleId)
        if (prev.length >= 3) return prev
        return [...prev, roleId]
      })
    }

    const handlePrepComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [],
            data: {
              roleId: 'imp',
              playerId: player.id,
              action: 'system_demon_bluffs',
              bluffRoleIds: selectedBluffs,
            },
          },
        ],
      })
    }

    const handleConfirmKill = () => {
      if (!selectedTarget) return

      const target = state.players.find((candidate) => candidate.id === selectedTarget)
      if (!target) return

      if (selectedTarget === player.id && hasAliveMinions && !malfunctioning) {
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
                params: {
                  player: player.id,
                  target: target.id,
                },
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

    if (phase === 'select_bluffs') {
      return (
        <NarratorSetupLayout
          icon='flameKindling'
          roleName={getRoleName('imp', language)}
          playerName={player.name}
          audience='narrator'
          onShowToPlayer={handlePrepComplete}
          showToPlayerDisabled={selectedBluffs.length !== 3}
          showToPlayerLabel={t.common.confirm}
        >
          <div className='text-center mb-4'>
            <h3 className='text-lg font-semibold text-amber-200'>
              {roleT.selectBluffsTitle}
            </h3>
            <p className='text-sm text-stone-400 mt-1'>
              {roleT.selectBluffsDescription}
            </p>
          </div>

          <StepSection
            step={1}
            label={roleT.selectThreeBluffs}
            count={{ current: selectedBluffs.length, max: 3 }}
          >
            <RolePickerGrid
              roles={goodRolesNotInPlay}
              state={state}
              selected={selectedBluffs}
              onSelect={handleBluffToggle}
              selectionCount={3}
              colorMode='team'
            />
          </StepSection>
        </NarratorSetupLayout>
      )
    }

    if (phase === 'step_list') {
      const steps: NightStep[] = [
        {
          id: 'choose_victim',
          icon: 'flameKindling',
          label: t.game.stepChooseVictim,
          status: 'pending',
          audience: 'player_choice' as const,
        },
      ]

      return (
        <NightStepListLayout
          icon='flameKindling'
          roleName={getRoleName('imp', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={() => setPhase('choose_victim')}
        />
      )
    }

    return (
      <NightActionLayout
        player={player}
        title={t.game.choosePlayerToKill}
        description={interpolate(t.game.selectVictim, { player: player.name })}
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
