import { useMemo, useState } from 'react'
import { Game, GameState, getPlayer, hasEffect } from '../../lib/types'
import { getCurrentRoleId } from '../../lib/identity'
import { getRole, getRolesForGame } from '../../lib/roles'
import { getPreparedNightActionData } from '../../lib/game'
import {
  DEMON_CREATION_ARBITRARY_DEATH_CAUSE,
  SYSTEM_DEMON_CREATION_DEATHS_ACTION,
} from '../../lib/nightSystem'
import {
  useI18n,
  getRoleDescription,
  getRoleName,
} from '../../lib/i18n'
import { isGoodTeam } from '../../lib/teams'
import { Button, Icon } from '../atoms'
import {
  EvilTeamReveal,
  MysticDivider,
  StepSection,
} from '../items'
import { PlayerPickerList, RolePickerGrid } from '../inputs'
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
  const [selectedDeathIds, setSelectedDeathIds] = useState<string[]>([])
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
  const alivePlayers = useMemo(
    () => state.players.filter((candidate) => !hasEffect(candidate, 'dead')),
    [state.players],
  )

  if (!player && systemStepId !== 'demon_creation_deaths') return null

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

  if (systemStepId === 'demon_creation_deaths') {
    const toggleDeathTarget = (nextPlayerId: string) => {
      setSelectedDeathIds((current) =>
        current.includes(nextPlayerId)
          ? current.filter((id) => id !== nextPlayerId)
          : [...current, nextPlayerId],
      )
    }

    const targetIds = [...new Set(selectedDeathIds)]
    const message =
      targetIds.length === 0
        ? [{ type: 'text' as const, content: 'No arbitrary deaths selected.' }]
        : [
            { type: 'text' as const, content: 'Arbitrary night deaths: ' },
            ...targetIds.flatMap((targetId, index) =>
              index === 0
                ? [{ type: 'player' as const, playerId: targetId }]
                : [
                    { type: 'text' as const, content: ', ' },
                    { type: 'player' as const, playerId: targetId },
                  ],
            ),
          ]

    return (
      <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col'>
        <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
          <div className='max-w-lg mx-auto text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name='skull' size='3xl' className='text-red-400 text-glow-red' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {t.game.demonCreationDeaths}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {t.game.demonCreationDeathsDescription}
            </p>
          </div>
        </div>

        <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
          <StepSection
            step={1}
            label={t.game.stepSelectPlayers}
            count={{ current: targetIds.length, max: alivePlayers.length }}
          >
            <PlayerPickerList
              players={alivePlayers}
              selected={targetIds}
              onSelect={toggleDeathTarget}
              selectionCount={null}
              variant='red'
            />
          </StepSection>
        </div>

        <ScreenFooter borderColor='border-red-500/30'>
          <Button
            onClick={() =>
              onComplete({
                entries: [
                  {
                    type: 'night_action',
                    message,
                    data: {
                      playerId,
                      roleId,
                      systemStepId,
                      action: SYSTEM_DEMON_CREATION_DEATHS_ACTION,
                      targetIds,
                    },
                  },
                ],
                intents: targetIds.map((targetId) => ({
                  type: 'kill' as const,
                  sourceId: playerId,
                  targetId,
                  cause: DEMON_CREATION_ARBITRARY_DEATH_CAUSE,
                })),
              })
            }
            fullWidth
            size='lg'
            variant='slayer'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.game.demonCreationDeathsConfirm}
          </Button>
        </ScreenFooter>
      </div>
    )
  }

  if (!player) return null

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
