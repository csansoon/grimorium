import { useMemo, useState } from 'react'
import { Game, GameState, getPlayer } from '../../lib/types'
import { getCurrentRoleId } from '../../lib/identity'
import { getRole, getRolesForGame } from '../../lib/roles'
import { getPreparedNightActionData } from '../../lib/game'
import {
  useI18n,
  getRoleDescription,
  getRoleName,
} from '../../lib/i18n'
import { isGoodTeam } from '../../lib/teams'
import { Icon } from '../atoms'
import {
  EvilTeamReveal,
  MysticDivider,
  StepSection,
} from '../items'
import { RolePickerGrid } from '../inputs'
import {
  HandbackButton,
  NarratorSetupLayout,
  NightActionLayout,
  PlayerFacingScreen,
} from '../layouts'
import { ScreenFooter } from '../layouts/ScreenFooter'
import type { NightActionResult } from '../../lib/roles/types'
import type { NightSystemStepId } from '../../lib/game'

type Props = {
  game: Game
  state: GameState
  playerId: string
  roleId: string
  systemStepId: NightSystemStepId
  onComplete: (result: NightActionResult) => void
}

type BluffPhase = 'select_bluffs' | 'show_bluffs'

export function NightSystemActionScreen({
  game,
  state,
  playerId,
  roleId,
  systemStepId,
  onComplete,
}: Props) {
  const { t, language } = useI18n()
  const player = getPlayer(state, playerId)
  const [selectedBluffs, setSelectedBluffs] = useState<string[]>(() => {
    const preparedData = getPreparedNightActionData<{ bluffRoleIds: string[] }>(
      game,
      playerId,
      roleId,
    )
    return preparedData?.bluffRoleIds ?? []
  })
  const [bluffPhase, setBluffPhase] = useState<BluffPhase>(() =>
    selectedBluffs.length === 3 ? 'show_bluffs' : 'select_bluffs',
  )

  const goodRolesNotInPlay = useMemo(() => {
    const rolesInPlay = new Set(state.players.map((candidate) => getCurrentRoleId(candidate)))
    return getRolesForGame(game).filter(
      (candidate) =>
        isGoodTeam(candidate.team) &&
        !rolesInPlay.has(candidate.id),
    )
  }, [game, state.players])

  const bluffRoles = selectedBluffs.map((id) => getRole(id)).filter(Boolean)

  if (!player) return null

  const complete = (action: string, data: Record<string, unknown> = {}) => {
    onComplete({
      entries: [
        {
          type: 'night_action',
          message: [],
          data: {
            playerId,
            roleId,
            systemStepId,
            action,
            ...data,
          },
        },
      ],
    })
  }

  if (systemStepId === 'minion_info') {
    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout
          player={player}
          title={t.game.minionInfo}
          description={t.game.minionInfoDescription}
        >
          <div className='mb-6'>
            <EvilTeamReveal state={state} viewer={player} viewerType='minion' />
          </div>

          <HandbackButton
            onClick={() => complete('system_minion_info')}
            fullWidth
            size='lg'
            variant='evil'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  }

  if (systemStepId === 'demon_info') {
    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout
          player={player}
          title={t.game.demonInfo}
          description={t.game.demonInfoDescription}
        >
          <div className='mb-6'>
            <EvilTeamReveal state={state} viewer={player} viewerType='demon' />
          </div>

          <HandbackButton
            onClick={() => complete('system_demon_info')}
            fullWidth
            size='lg'
            variant='evil'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  }

  const handleBluffToggle = (nextRoleId: string) => {
    setSelectedBluffs((current) => {
      if (current.includes(nextRoleId)) {
        return current.filter((id) => id !== nextRoleId)
      }
      if (current.length >= 3) return current
      return [...current, nextRoleId]
    })
  }

  if (bluffPhase === 'select_bluffs') {
    return (
      <NarratorSetupLayout
        icon='flameKindling'
        roleName={getRoleName(roleId, language)}
        playerName={player.name}
        audience='narrator'
        onShowToPlayer={() => setBluffPhase('show_bluffs')}
        showToPlayerDisabled={selectedBluffs.length !== 3}
        showToPlayerLabel={t.common.confirm}
      >
        <div className='text-center mb-4'>
          <h3 className='text-lg font-semibold text-amber-200'>
            {t.game.stepSelectBluffs}
          </h3>
          <p className='text-sm text-stone-400 mt-1'>
            {t.game.demonBluffsDescription}
          </p>
        </div>

        <StepSection
          step={1}
          label={t.game.stepShowBluffs}
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

  return (
    <PlayerFacingScreen playerName={player.name}>
      <NightActionLayout
        player={player}
        title={t.game.stepShowBluffs}
        description={t.game.demonBluffsDescription}
      >
        <div className='mb-6'>
          <div className='grid grid-cols-1 gap-3'>
            {bluffRoles.map((role) => {
              if (!role) return null
              const description = getRoleDescription(role.id, language)
              return (
                <div
                  key={role.id}
                  className='rounded-xl border-2 border-indigo-500/30 bg-gradient-to-b from-indigo-900/30 to-blue-900/20 p-4'
                >
                  <div className='flex items-start gap-3'>
                    <div className='w-10 h-10 rounded-full bg-indigo-800/40 border border-indigo-500/30 flex items-center justify-center flex-shrink-0'>
                      <Icon
                        name={role.icon}
                        size='md'
                        className='text-indigo-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-parchment-100 font-tarot tracking-wider uppercase text-sm'>
                        {getRoleName(role.id, language)}
                      </div>
                      {description && (
                        <p className='text-xs text-parchment-400 mt-1 leading-snug'>
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <MysticDivider />

        <ScreenFooter borderColor='border-indigo-500/30'>
          <HandbackButton
            onClick={() =>
              complete('system_demon_bluffs', { bluffRoleIds: selectedBluffs })
            }
            fullWidth
            size='lg'
            variant='evil'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </ScreenFooter>
      </NightActionLayout>
    </PlayerFacingScreen>
  )
}
