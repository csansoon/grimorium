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
  NightActionLayout,
  NarratorSetupLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import {
  StepSection,
  AlertBox,
  RoleRevealBadge,
  InfoBox,
} from '../../../../../components/items'
import {
  PlayerPickerList,
  RolePickerGrid,
} from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { perceive, canRegisterAsTeam } from '../../../../pipeline'
import { isMalfunctioning } from '../../../../effects'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('librarian', 'en', en)
registerRoleTranslations('librarian', 'es', es)

type Phase =
  | 'step_list'
  | 'select_players'
  | 'configure_malfunction'
  | 'show_results'
  | 'no_outsiders_view'

const definition: RoleDefinition = {
  id: 'librarian',
  team: 'townsfolk',
  icon: 'bookMarked',
  nightOrder: 11,
  chaos: 15,
  shouldWake: (game, player) =>
    isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  nightSteps: [
    {
      id: 'select_players',
      icon: 'bookMarked',
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
      icon: 'bookMarked',
      getLabel: (t) => t.game.stepShowResult,
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('librarian', language)
    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
    const [selectedOutsider, setSelectedOutsider] = useState<string | null>(
      null,
    )
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const [selectPlayersDone, setSelectPlayersDone] = useState(false)
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

    const malfunctioning = isMalfunctioning(player)
    const otherPlayers = state.players.filter((p) => p.id !== player.id)

    // All defined outsider roles (for malfunction role picker)
    const outsiderRoles = getAllRoles().filter((r) => r.team === 'outsider')

    // Check if any outsiders exist in game (for healthy flow)
    const outsidersInGame = state.players.filter((p) => {
      const perception = perceive(p, player, 'team', state)
      return perception.team === 'outsider' || canRegisterAsTeam(p, 'outsider')
    })
    const hasOutsiders = outsidersInGame.length > 0

    // Players that register or could register as outsider in selection (for healthy flow)
    const outsidersInSelection = selectedPlayers.filter((playerId) => {
      const p = state.players.find((pl) => pl.id === playerId)
      if (!p) return false
      const perception = perceive(p, player, 'team', state)
      return perception.team === 'outsider' || canRegisterAsTeam(p, 'outsider')
    })

    // Build flat unique role list with player mapping for role picker
    const outsiderRoleOptions = (() => {
      const roleToPlayers = new Map<string, string[]>()
      const roles: RoleDefinition[] = []
      const seen = new Set<string>()
      for (const pid of outsidersInSelection) {
        const p = state.players.find((pl) => pl.id === pid)
        if (!p) continue
        const pTeam = perceive(p, player, 'team', state)
        const pRoles =
          pTeam.team === 'outsider'
            ? (() => {
                const rp = perceive(p, player, 'role', state)
                const r = getRole(rp.roleId)
                return r ? [r] : []
              })()
            : outsiderRoles
        for (const role of pRoles) {
          if (!roleToPlayers.has(role.id)) roleToPlayers.set(role.id, [])
          if (!roleToPlayers.get(role.id)!.includes(pid))
            roleToPlayers.get(role.id)!.push(pid)
          if (!seen.has(role.id)) {
            seen.add(role.id)
            roles.push(role)
          }
        }
      }
      return { roles, roleToPlayers }
    })()

    // Healthy flow: can proceed when 2 players selected + outsider identified + role selected
    const canCompleteHealthySetup =
      selectedPlayers.length === 2 &&
      outsidersInSelection.length >= 1 &&
      selectedOutsider !== null &&
      selectedRoleId !== null

    // Malfunction flow: can proceed from select_players when 2 players selected
    const canCompleteMalfunctionSelect = selectedPlayers.length === 2

    // Malfunction flow: can proceed from configure_malfunction when role selected
    const canCompleteMalfunctionConfig = selectedRoleId !== null

    const handlePlayerToggle = (playerId: string) => {
      setSelectedPlayers((prev) => {
        if (prev.includes(playerId)) {
          if (playerId === selectedOutsider) {
            setSelectedOutsider(null)
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
      if (selectedRoleId === roleId) {
        setSelectedOutsider(null)
        setSelectedRoleId(null)
      } else {
        setSelectedOutsider(playerId)
        setSelectedRoleId(roleId)
      }
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
      if (!selectedOutsider) setSelectedOutsider(selectedPlayers[0])
      setMalfunctionConfigDone(true)
      setPhase('step_list')
    }

    // Healthy flow: no outsiders → show "no outsiders" to player
    const handleShowNoOutsiders = () => {
      setPhase('no_outsiders_view')
    }

    const handleCompleteNoOutsiders = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.librarian.history.noOutsiders',
                params: { player: player.id },
              },
            ],
            data: {
              roleId: 'librarian',
              playerId: player.id,
              action: 'no_outsiders',
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
      })
    }

    const handleComplete = () => {
      if (!selectedOutsider || !selectedRoleId) return

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
                key: 'roles.librarian.history.discoveredOutsider',
                params: {
                  player: player.id,
                  player1: player1.id,
                  player2: player2.id,
                  role: selectedRoleId,
                },
              },
            ],
            data: {
              roleId: 'librarian',
              playerId: player.id,
              action: 'see_outsider',
              shownPlayers: selectedPlayers,
              outsiderId: selectedOutsider,
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
        icon: 'bookMarked',
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
        icon: 'bookMarked',
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
          icon='bookMarked'
          roleName={getLocalRoleName('librarian')}
          playerName={player.name}
          steps={steps}
          onSelectStep={handleSelectStep}
        />
      )
    }

    // ================================================================
    // Phase: Select Players (healthy, no outsiders in game)
    // ================================================================
    if (phase === 'select_players' && !malfunctioning && !hasOutsiders) {
      return (
        <NarratorSetupLayout
          icon='bookMarked'
          roleName={getLocalRoleName('librarian')}
          playerName={getPlayerName(player.id)}
          onShowToPlayer={handleShowNoOutsiders}
          showToPlayerLabel={roleT.confirmNoOutsiders}
        >
          <div className='flex-1 flex items-center justify-center'>
            <InfoBox
              icon='bookMarked'
              title={roleT.noOutsidersInGame}
              description={roleT.noOutsidersMessage}
            />
          </div>
        </NarratorSetupLayout>
      )
    }

    // ================================================================
    // Phase: Select Players (healthy, outsiders exist — with constraints + role picking)
    // ================================================================
    if (phase === 'select_players' && !malfunctioning) {
      return (
        <NarratorSetupLayout
          icon='bookMarked'
          roleName={getLocalRoleName('librarian')}
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

          {selectedPlayers.length === 2 && outsidersInSelection.length > 0 && (
            <StepSection step={2} label={t.game.selectWhichRoleToShow}>
              <RolePickerGrid
                roles={outsiderRoleOptions.roles}
                state={state}
                selected={selectedRoleId ? [selectedRoleId] : []}
                onSelect={(roleId) => {
                  const pids =
                    outsiderRoleOptions.roleToPlayers.get(roleId)
                  if (pids?.[0]) handleSelectRole(pids[0], roleId)
                }}
                selectionCount={1}
                colorMode='team'
              />
            </StepSection>
          )}

          {selectedPlayers.length === 2 &&
            outsidersInSelection.length === 0 && (
              <AlertBox message={roleT.mustIncludeOutsider} />
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
          icon='bookMarked'
          roleName={getLocalRoleName('librarian')}
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

          <div className='mt-4 pt-4 border-t border-parchment-700/30 text-center'>
            <button
              onClick={() => setPhase('no_outsiders_view')}
              className='text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2'
            >
              {roleT.showNoOutsiders}
            </button>
          </div>
        </NarratorSetupLayout>
      )
    }

    // ================================================================
    // Phase: Configure Malfunction
    // ================================================================
    if (phase === 'configure_malfunction') {
      return (
        <NarratorSetupLayout
          icon='bookMarked'
          roleName={getLocalRoleName('librarian')}
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
              roles={outsiderRoles}
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
    // Phase: No Outsiders View (healthy path — player-facing)
    // ================================================================
    if (phase === 'no_outsiders_view') {
      return (
        <PlayerFacingScreen>
          <NightActionLayout
            player={player}
            title={roleT.librarianInfo}
            description={roleT.noOutsidersMessage}
          >
            <RoleRevealBadge
              icon='sparkles'
              roleName={roleT.noOutsidersInGame}
            />

            <Button
              onClick={handleCompleteNoOutsiders}
              fullWidth
              size='lg'
              variant='night'
            >
              <Icon name='check' size='md' className='mr-2' />
              {t.common.iUnderstandMyRole}
            </Button>
          </NightActionLayout>
        </PlayerFacingScreen>
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
