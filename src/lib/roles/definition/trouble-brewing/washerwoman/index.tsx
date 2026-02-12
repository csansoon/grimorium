import { useState, useMemo } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import { getRole, getAllRoles } from '../../../index'
import { getTeam } from '../../../../teams'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { RoleCard } from '../../../../../components/items/RoleCard'
import {
  TeamBackground,
  CardLink,
} from '../../../../../components/items/TeamBackground'
import {
  NarratorSetupLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { StepSection, AlertBox } from '../../../../../components/items'
import {
  PlayerPickerList,
  RolePickerGrid,
} from '../../../../../components/inputs'
import { Icon } from '../../../../../components/atoms'
import { perceive, canRegisterAsTeam } from '../../../../pipeline'
import { isMalfunctioning } from '../../../../effects'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('washerwoman', 'en', en)
registerRoleTranslations('washerwoman', 'es', es)

type Phase =
  | 'step_list'
  | 'select_players'
  | 'configure_malfunction'
  | 'show_results'

const definition: RoleDefinition = {
  id: 'washerwoman',
  team: 'townsfolk',
  icon: 'shirt',
  nightOrder: 10,
  chaos: 10,
  shouldWake: (game, player) =>
    isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  nightSteps: [
    {
      id: 'select_players',
      icon: 'shirt',
      getLabel: (t) => t.game.stepSelectPlayers,
    },
    {
      id: 'configure_malfunction',
      icon: 'flask',
      getLabel: (t) => t.game.stepConfigureMalfunction,
      condition: (_game, player) => isMalfunctioning(player),
    },
    {
      id: 'show_results',
      icon: 'shirt',
      getLabel: (t) => t.game.stepShowResult,
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('washerwoman', language)
    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
    const [selectedTownsfolk, setSelectedTownsfolk] = useState<string | null>(
      null,
    )
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const [selectPlayersDone, setSelectPlayersDone] = useState(false)
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

    const malfunctioning = isMalfunctioning(player)
    const otherPlayers = state.players.filter((p) => p.id !== player.id)

    // All defined townsfolk roles (for malfunction role picker)
    const townsfolkRoles = getAllRoles().filter((r) => r.team === 'townsfolk')

    // Players that register or could register as townsfolk (for healthy flow)
    const townsfolkInSelection = selectedPlayers.filter((playerId) => {
      const p = state.players.find((pl) => pl.id === playerId)
      if (!p) return false
      const perception = perceive(p, player, 'team', state)
      return (
        perception.team === 'townsfolk' || canRegisterAsTeam(p, 'townsfolk')
      )
    })

    // Healthy flow: can proceed when 2 players selected + townsfolk identified + role selected
    const canCompleteHealthySetup =
      selectedPlayers.length === 2 &&
      townsfolkInSelection.length >= 1 &&
      selectedTownsfolk !== null &&
      selectedRoleId !== null

    // Malfunction flow: can proceed from select_players when 2 players selected
    const canCompleteMalfunctionSelect = selectedPlayers.length === 2

    // Malfunction flow: can proceed from configure_malfunction when role selected
    const canCompleteMalfunctionConfig = selectedRoleId !== null

    const handlePlayerToggle = (playerId: string) => {
      setSelectedPlayers((prev) => {
        if (prev.includes(playerId)) {
          if (playerId === selectedTownsfolk) {
            setSelectedTownsfolk(null)
            setSelectedRoleId(null)
          }
          return prev.filter((id) => id !== playerId)
        } else if (prev.length < 2) {
          return [...prev, playerId]
        }
        return prev
      })
    }

    const handleSelectRole = (playerId: string, roleId: string) => {
      setSelectedTownsfolk(playerId)
      setSelectedRoleId(roleId)
    }

    const handleMalfunctionSelectRole = (roleId: string) => {
      setSelectedRoleId((prev) => (prev === roleId ? null : roleId))
    }

    const handleCompleteSelectPlayers = () => {
      if (malfunctioning) {
        if (!canCompleteMalfunctionSelect) return
      } else {
        if (!canCompleteHealthySetup) return
      }
      setSelectPlayersDone(true)
      setPhase('step_list')
    }

    const handleCompleteMalfunctionConfig = () => {
      if (!selectedRoleId) return
      // Auto-assign target player for history (arbitrary — info is false)
      if (!selectedTownsfolk) setSelectedTownsfolk(selectedPlayers[0])
      setMalfunctionConfigDone(true)
      setPhase('step_list')
    }

    const handleComplete = () => {
      if (!selectedTownsfolk || !selectedRoleId) return

      const player1 = state.players.find((p) => p.id === selectedPlayers[0])
      const player2 = state.players.find((p) => p.id === selectedPlayers[1])
      if (!player1 || !player2) return

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.washerwoman.history.discoveredTownsfolk',
                params: {
                  player: player.id,
                  player1: player1.id,
                  player2: player2.id,
                  role: selectedRoleId,
                },
              },
            ],
            data: {
              roleId: 'washerwoman',
              playerId: player.id,
              action: 'see_townsfolk',
              shownPlayers: selectedPlayers,
              townsfolkId: selectedTownsfolk,
              shownRoleId: selectedRoleId,
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
      })
    }

    const getLocalRoleName = (roleId: string) => getRoleName(roleId, language)

    const getPlayerName = (playerId: string) => {
      return state.players.find((p) => p.id === playerId)?.name ?? 'Unknown'
    }

    // Build steps
    const steps: NightStep[] = useMemo(() => {
      const result: NightStep[] = []

      result.push({
        id: 'select_players',
        icon: 'shirt',
        label: t.game.stepSelectPlayers,
        status: selectPlayersDone ? 'done' : 'pending',
      })

      if (malfunctioning) {
        result.push({
          id: 'configure_malfunction',
          icon: 'flask',
          label: t.game.stepConfigureMalfunction,
          status: malfunctionConfigDone ? 'done' : 'pending',
        })
      }

      result.push({
        id: 'show_results',
        icon: 'shirt',
        label: t.game.stepShowResult,
        status: 'pending',
      })

      return result
    }, [selectPlayersDone, malfunctioning, malfunctionConfigDone, t])

    const handleSelectStep = (stepId: string) => {
      if (stepId === 'select_players') setPhase('select_players')
      else if (stepId === 'configure_malfunction')
        setPhase('configure_malfunction')
      else if (stepId === 'show_results') setPhase('show_results')
    }

    // ================================================================
    // Phase: Step List
    // ================================================================
    if (phase === 'step_list') {
      return (
        <NightStepListLayout
          icon='shirt'
          roleName={getLocalRoleName('washerwoman')}
          playerName={player.name}
          steps={steps}
          onSelectStep={handleSelectStep}
        />
      )
    }

    // ================================================================
    // Phase: Select Players (healthy — with constraints + role picking)
    // ================================================================
    if (phase === 'select_players' && !malfunctioning) {
      return (
        <NarratorSetupLayout
          icon='shirt'
          roleName={getLocalRoleName('washerwoman')}
          playerName={getPlayerName(player.id)}
          onShowToPlayer={handleCompleteSelectPlayers}
          showToPlayerDisabled={!canCompleteHealthySetup}
          showToPlayerLabel={t.common.confirm}
        >
          <StepSection
            step={1}
            label={t.game.selectTwoPlayers}
            count={{ current: selectedPlayers.length, max: 2 }}
          >
            <PlayerPickerList
              players={otherPlayers}
              selected={selectedPlayers}
              onSelect={handlePlayerToggle}
              selectionCount={2}
              variant='blue'
            />
          </StepSection>

          {selectedPlayers.length === 2 && townsfolkInSelection.length > 0 && (
            <StepSection step={2} label={t.game.selectWhichRoleToShow}>
              {townsfolkInSelection.map((playerId) => {
                const p = state.players.find((pl) => pl.id === playerId)
                if (!p) return null
                const pPerception = perceive(p, player, 'team', state)

                // Determine available roles for this player
                const availableRoles =
                  pPerception.team === 'townsfolk'
                    ? (() => {
                        const rolePerception = perceive(
                          p,
                          player,
                          'role',
                          state,
                        )
                        const perceivedRole = getRole(rolePerception.roleId)
                        return perceivedRole ? [perceivedRole] : []
                      })()
                    : townsfolkRoles

                const currentSelected =
                  selectedTownsfolk === playerId && selectedRoleId
                    ? [selectedRoleId]
                    : []

                return (
                  <div key={playerId} className='mb-3'>
                    <div className='text-xs font-medium text-parchment-400 mb-1.5 ml-1'>
                      <Icon
                        name='user'
                        size='xs'
                        className='inline mr-1 text-parchment-500'
                      />
                      {p.name}
                    </div>
                    <RolePickerGrid
                      roles={availableRoles}
                      state={state}
                      selected={currentSelected}
                      onSelect={(roleId) => handleSelectRole(playerId, roleId)}
                      selectionCount={1}
                      colorMode='team'
                    />
                  </div>
                )
              })}
            </StepSection>
          )}

          {selectedPlayers.length === 2 &&
            townsfolkInSelection.length === 0 && (
              <AlertBox message={roleT.mustIncludeTownsfolk} />
            )}
        </NarratorSetupLayout>
      )
    }

    // ================================================================
    // Phase: Select Players (malfunctioning — free selection)
    // ================================================================
    if (phase === 'select_players' && malfunctioning) {
      return (
        <NarratorSetupLayout
          icon='shirt'
          roleName={getLocalRoleName('washerwoman')}
          playerName={getPlayerName(player.id)}
          onShowToPlayer={handleCompleteSelectPlayers}
          showToPlayerDisabled={!canCompleteMalfunctionSelect}
          showToPlayerLabel={t.common.confirm}
        >
          {/* Malfunction warning */}
          <div className='rounded-xl border border-amber-500/30 bg-amber-900/20 p-3 mb-4'>
            <div className='flex items-center gap-2'>
              <Icon
                name='flask'
                size='md'
                className='text-amber-400 flex-shrink-0'
              />
              <p className='text-sm text-amber-300 font-medium'>
                {t.game.malfunctionWarning}
              </p>
            </div>
            <p className='text-xs text-amber-400/70 mt-1 ml-7'>
              {t.game.playerIsMalfunctioning}
            </p>
          </div>

          <StepSection
            step={1}
            label={t.game.selectTwoPlayers}
            count={{ current: selectedPlayers.length, max: 2 }}
          >
            <PlayerPickerList
              players={otherPlayers}
              selected={selectedPlayers}
              onSelect={handlePlayerToggle}
              selectionCount={2}
              variant='blue'
            />
          </StepSection>
        </NarratorSetupLayout>
      )
    }

    // ================================================================
    // Phase: Configure Malfunction
    // ================================================================
    if (phase === 'configure_malfunction') {
      return (
        <NarratorSetupLayout
          icon='shirt'
          roleName={getLocalRoleName('washerwoman')}
          playerName={getPlayerName(player.id)}
          onShowToPlayer={handleCompleteMalfunctionConfig}
          showToPlayerDisabled={!canCompleteMalfunctionConfig}
          showToPlayerLabel={t.common.confirm}
        >
          {/* Malfunction warning */}
          <div className='rounded-xl border border-amber-500/30 bg-amber-900/20 p-3 mb-4'>
            <div className='flex items-center gap-2'>
              <Icon
                name='flask'
                size='md'
                className='text-amber-400 flex-shrink-0'
              />
              <p className='text-sm text-amber-300 font-medium'>
                {t.game.malfunctionWarning}
              </p>
            </div>
            <p className='text-xs text-amber-400/70 mt-1 ml-7'>
              {t.game.playerIsMalfunctioning}
            </p>
          </div>

          <StepSection step={1} label={t.game.chooseFalseRole}>
            <RolePickerGrid
              roles={townsfolkRoles}
              state={state}
              selected={selectedRoleId ? [selectedRoleId] : []}
              onSelect={handleMalfunctionSelectRole}
              selectionCount={1}
              colorMode='team'
            />
          </StepSection>
        </NarratorSetupLayout>
      )
    }

    // ================================================================
    // Phase: Show Results (player view)
    // ================================================================
    const player1 = state.players.find((p) => p.id === selectedPlayers[0])
    const player2 = state.players.find((p) => p.id === selectedPlayers[1])

    if (!selectedRoleId) return null

    const shownRole = getRole(selectedRoleId)
    const shownTeamId = shownRole?.team ?? 'townsfolk'
    const shownTeam = getTeam(shownTeamId)

    return (
      <PlayerFacingScreen>
        <TeamBackground teamId={shownTeamId}>
          <div
            className={`text-center text-sm mb-5 max-w-sm mx-auto ${shownTeam.isEvil ? 'text-red-300/80' : 'text-parchment-300/80'}`}
          >
            <p className='uppercase tracking-widest font-semibold mb-3'>
              {t.game.oneOfThemIsThe}
            </p>
            <div className='flex items-center justify-center gap-2 flex-wrap'>
              {player1 && (
                <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-base'>
                  <Icon name='user' size='sm' />
                  <span className='font-medium'>{player1.name}</span>
                </span>
              )}
              {player2 && (
                <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-base'>
                  <Icon name='user' size='sm' />
                  <span className='font-medium'>{player2.name}</span>
                </span>
              )}
            </div>
          </div>

          <RoleCard roleId={selectedRoleId} />

          <CardLink onClick={handleComplete} isEvil={shownTeam.isEvil}>
            {t.common.continue}
          </CardLink>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  },
}

export default definition
