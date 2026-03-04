import { useState, useCallback, useMemo } from 'react'
import { Game, getCurrentState, getPlayer, PlayerState } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getTeam } from '../../lib/teams'
import { RoleCard } from '../items/RoleCard'
import { TeamBackground, CardLink } from '../items/TeamBackground'
import {
  markRoleRevealed,
  startNight,
  startDay,
  applyNightAction,
  skipNightAction,
  nominate,
  cancelNomination,
  resolveVote,
  executeAtEndOfDay,
  endGame,
  checkWinCondition,
  checkEndOfDayWinConditions,
  addEffectToPlayer,
  removeEffectFromPlayer,
  updateEffectData,
  reorderPlayers,
  processAutoSkips,
  applySetupAction,
  recordPreparedNightAction,
  getPreparedNightActionData,
  getLastNightDeaths,
  getNominatorsToday,
  getNomineesToday,
  getBlockStatus,
  hasVirginExecutionToday,
} from '../../lib/game'
import { isAlive } from '../../lib/types'
import {
  resolveIntent,
  applyPipelineChanges,
  getAvailableDayActions,
  getAmbiguousPlayers,
} from '../../lib/pipeline'
import {
  PipelineResult,
  PipelineInputProps,
  AvailableDayAction,
  AvailableNightFollowUp,
  NightFollowUpResult,
  DayActionResult,
} from '../../lib/pipeline/types'
import { saveGame } from '../../lib/storage'
import { getRoleName, interpolate, useI18n } from '../../lib/i18n'
import { RoleRevelationScreen } from './RoleRevelationScreen'
import { NightDashboard } from './NightDashboard'
import { DayPhase } from './DayPhase'
import { NominationScreen } from './NominationScreen'
import { VotingPhase } from './VotingPhase'
import { GameOver } from './GameOver'
import { HistoryView } from './HistoryView'
import { RolesLibrary } from './RolesLibrary'
import { StorytellerNotesView } from './StorytellerNotesView'
import { GrimoireModal, type GrimoireIntent } from '../items/GrimoireModal'
import { StorytellerFabMenu } from '../items/StorytellerFabMenu'
import { Icon, LanguagePicker } from '../atoms'
import { NightActionResult, SetupActionResult } from '../../lib/roles/types'
import type { FC } from 'react'
import { SetupActionsScreen } from './SetupActionsScreen'
import { NightPrepScreen } from './NightPrepScreen'
import { DawnScreen } from './DawnScreen'
import { DeathRevealScreen, DeathRevealEntry } from './DeathRevealScreen'
import { NightActionReplayScreen } from './NightActionReplayScreen'
import { NightSystemActionScreen } from './NightSystemActionScreen'
import { PlayerFacingContext } from '../context/PlayerFacingContext'
import { PlayerFacingScreen } from '../layouts/PlayerFacingScreen'
import type { Language, Translations } from '../../lib/i18n/types'
import type { IconName } from '../atoms/icon'
import { isMalfunctioning } from '../../lib/effects'
import type { NightSystemStepId } from '../../lib/game'
import type { RoleId } from '../../lib/roles/types'
import { getScriptForGame } from '../../lib/scripts'

type Props = {
  initialGame: Game
  onMainMenu: () => void
}

type Screen =
  | { type: 'setup_actions' }
  | { type: 'setup_action'; playerId: string; roleId: string }
  | { type: 'night_prep' }
  | { type: 'night_prep_action'; playerId: string; roleId: string }
  | { type: 'role_revelation' }
  | { type: 'showing_role'; playerId: string }
  | { type: 'night_dashboard' }
  | {
      type: 'night_action'
      playerId: string
      roleId: string
      systemStepId?: NightSystemStepId
    }
  | {
      type: 'night_action_replay'
      playerId: string
      roleId: string
      systemStepId?: NightSystemStepId
    }
  | { type: 'night_follow_up'; followUp: AvailableNightFollowUp }
  | { type: 'dawn'; deaths: string[]; round: number }
  | { type: 'day' }
  | { type: 'nomination' }
  | { type: 'day_action'; action: AvailableDayAction; mode?: 'day' | 'end_day' }
  | { type: 'voting'; nomineeId: string; nominatorId: string }
  | { type: 'pipeline_input' }
  | { type: 'game_over' }
  | { type: 'death_reveal'; deaths: DeathRevealEntry[]; next: Screen }
  | { type: 'grimoire_role_card'; playerId: string; returnTo: Screen }

type NightPrepItem = {
  playerId: string
  playerName: string
  roleId: string
  roleIcon: IconName
}

type NightPrepSummaryItem = NightPrepItem & {
  details: string[]
}

export function GameScreen({ initialGame, onMainMenu }: Props) {
  const { t, language } = useI18n()
  const [game, setGame] = useState<Game>(initialGame)
  const [screen, setScreen] = useState<Screen>(() =>
    getInitialScreen(initialGame),
  )
  const [showHistory, setShowHistory] = useState(false)
  const [showRolesLibrary, setShowRolesLibrary] = useState(false)
  const [selectedLibraryRoleId, setSelectedLibraryRoleId] =
    useState<RoleId | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [showGrimoire, setShowGrimoire] = useState(false)
  const [grimoireIntent, setGrimoireIntent] = useState<GrimoireIntent>({
    view: 'list',
  })

  // Pipeline UI state — shown when an intent needs narrator input mid-resolution
  const [pipelineUI, setPipelineUI] = useState<{
    Component: FC<PipelineInputProps>
    intent: import('../../lib/pipeline/types').Intent
    onResult: (result: unknown) => void
  } | null>(null)

  // Player-facing state — set by PlayerFacingScreen wrapper inside NightAction components
  const [isPlayerFacing, setIsPlayerFacing] = useState(false)
  const playerFacingCtx = useMemo(
    () => ({ setPlayerFacing: setIsPlayerFacing }),
    [],
  )

  const state = getCurrentState(game)
  const libraryRoleIds = useMemo(
    () =>
      getScriptForGame(game)?.roles ??
      state.players.map((player) => player.roleId),
    [game, state.players],
  )
  const pendingNightPrepItems = useMemo(
    () => getPendingNightPrepItems(game),
    [game],
  )
  const completedNightPrepItems = useMemo(
    () => getCompletedNightPrepItems(game, language, t),
    [game, language, t],
  )

  const updateGame = useCallback((newGame: Game) => {
    setGame(newGame)
    saveGame(newGame)
  }, [])

  const getDeathsBetweenStates = useCallback(
    (beforePlayers: PlayerState[], afterPlayers: PlayerState[]) =>
      beforePlayers
        .filter(isAlive)
        .filter(
          (player) =>
            !afterPlayers.some(
              (candidate) => candidate.id === player.id && isAlive(candidate),
            ),
        )
        .map((player) =>
          afterPlayers.find((candidate) => candidate.id === player.id),
        )
        .filter(Boolean)
        .map((player) => ({
          playerId: player!.id,
          playerName: player!.name,
          roleId: player!.roleId,
        })),
    [],
  )

  const getPendingResolutionActions = useCallback(
    (targetGame: Game) =>
      getAvailableDayActions(getCurrentState(targetGame), t, 'resolution'),
    [t],
  )

  const maybeFinishDayAndStartNight = useCallback(
    (currentGame: Game, deaths: DeathRevealEntry[] = []) => {
      const currentState = getCurrentState(currentGame)

      const postExecWinner = checkWinCondition(currentState, currentGame)
      if (postExecWinner) {
        const finalGame = endGame(currentGame, postExecWinner)
        updateGame(finalGame)
        setScreen({ type: 'game_over' })
        return
      }

      const endOfDayWinner = checkEndOfDayWinConditions(
        currentState,
        currentGame,
      )
      if (endOfDayWinner) {
        const finalGame = endGame(currentGame, endOfDayWinner)
        updateGame(finalGame)
        setScreen({ type: 'game_over' })
        return
      }

      const resolutionActions = getPendingResolutionActions(currentGame)
      if (resolutionActions.length > 0) {
        const next: Screen = {
          type: 'day_action',
          action: resolutionActions[0],
          mode: 'end_day',
        }
        if (deaths.length > 0) {
          setScreen({ type: 'death_reveal', deaths, next })
        } else {
          setScreen(next)
        }
        return
      }

      const nightGame = startNight(currentGame)
      const readyGame = processAutoSkips(nightGame)
      updateGame(readyGame)

      const next: Screen = { type: 'night_dashboard' }
      if (deaths.length > 0) {
        setScreen({ type: 'death_reveal', deaths, next })
      } else {
        setScreen(next)
      }
    },
    [getPendingResolutionActions, updateGame],
  )

  // ========================================================================
  // PIPELINE INTEGRATION
  // ========================================================================

  /**
   * Process a pipeline result. If resolved/prevented, apply changes.
   * If needs_input, show the pipeline's UI component.
   * Returns the updated game, or null if waiting for UI input.
   */
  const processPipelineResult = useCallback(
    (
      result: PipelineResult,
      currentGame: Game,
      afterComplete: (updatedGame: Game) => void,
    ) => {
      if (result.type === 'resolved' || result.type === 'prevented') {
        const newGame = applyPipelineChanges(currentGame, result.stateChanges)
        updateGame(newGame)
        setPipelineUI(null)
        afterComplete(newGame)
      } else if (result.type === 'needs_input') {
        const resumeFn = result.resume
        setPipelineUI({
          Component: result.UIComponent,
          intent: result.intent,
          onResult: (uiResult: unknown) => {
            const resumed = resumeFn(uiResult)
            processPipelineResult(resumed, currentGame, afterComplete)
          },
        })
        setScreen({ type: 'pipeline_input' })
      }
    },
    [updateGame],
  )

  // ========================================================================
  // ROLE REVELATION FLOW
  // ========================================================================

  const handleRevealRole = (playerId: string) => {
    setScreen({ type: 'showing_role', playerId })
  }

  const handleRoleRevealDismiss = () => {
    if (screen.type !== 'showing_role') return

    const newGame = markRoleRevealed(game, screen.playerId)
    updateGame(newGame)
    setScreen({ type: 'role_revelation' })
  }

  const handleStartFirstNight = () => {
    const nightGame = startNight(game)
    // Process auto-skips so the dashboard is ready
    const readyGame = processAutoSkips(nightGame)
    updateGame(readyGame)
    setScreen(getNightEntryScreen(readyGame))
  }

  // ========================================================================
  // SETUP ACTIONS FLOW
  // ========================================================================

  const handleOpenSetupAction = (playerId: string, roleId: string) => {
    setScreen({ type: 'setup_action', playerId, roleId })
  }

  const handleSetupActionComplete = (result: SetupActionResult) => {
    if (screen.type !== 'setup_action') return

    const newGame = applySetupAction(game, screen.playerId, result)
    updateGame(newGame)
    setScreen({ type: 'setup_actions' })
  }

  const handleSetupActionsContinue = () => {
    setScreen({ type: 'role_revelation' })
  }

  const handleOpenNightPrepAction = (playerId: string, roleId: string) => {
    setScreen({ type: 'night_prep_action', playerId, roleId })
  }

  const handleNightPrepComplete = (
    playerId: string,
    roleId: string,
    result: NightActionResult,
  ) => {
    const preparedData = result.entries[0]?.data
    if (!preparedData) return

    const newGame = recordPreparedNightAction(
      game,
      playerId,
      roleId,
      preparedData,
    )
    updateGame(newGame)
    setScreen({ type: 'night_prep' })
  }

  const handleNightPrepContinue = () => {
    setScreen({ type: 'night_dashboard' })
  }

  const handleNightPrepSetupComplete = (
    playerId: string,
    result: SetupActionResult,
  ) => {
    const newGame = applySetupAction(game, playerId, result)
    updateGame(newGame)
    setScreen({ type: 'night_prep' })
  }

  // ========================================================================
  // NIGHT DASHBOARD FLOW
  // ========================================================================

  const handleOpenNightAction = (
    playerId: string,
    roleId: string,
    systemStepId?: NightSystemStepId,
  ) => {
    const player = getPlayer(state, playerId)
    if (!player) return

    if (systemStepId) {
      setScreen({ type: 'night_action', playerId, roleId, systemStepId })
      return
    }

    const role = getRole(roleId)
    if (!role || !role.NightAction) {
      // Role has no night action component — auto-skip
      const newGame = skipNightAction(game, roleId, playerId, systemStepId)
      const readyGame = processAutoSkips(newGame)
      updateGame(readyGame)
      setScreen({ type: 'night_dashboard' })
      return
    }

    setScreen({ type: 'night_action', playerId, roleId, systemStepId })
  }

  const handleOpenNightFollowUp = (followUp: AvailableNightFollowUp) => {
    setScreen({ type: 'night_follow_up', followUp })
  }

  const handleReplayNightAction = (
    playerId: string,
    roleId: string,
    systemStepId?: NightSystemStepId,
  ) => {
    setScreen({ type: 'night_action_replay', playerId, roleId, systemStepId })
  }

  const handleNightActionComplete = (result: NightActionResult) => {
    if (screen.type !== 'night_action') return

    // Apply direct entries/effects (not the intent)
    const newGame = applyNightAction(game, result)
    updateGame(newGame)

    if (result.intent) {
      // Resolve the intent through the pipeline
      const pipelineResult = resolveIntent(
        result.intent,
        getCurrentState(newGame),
        newGame,
      )
      processPipelineResult(pipelineResult, newGame, (updatedGame) => {
        // After pipeline resolution, check win conditions and return to dashboard
        const winner = checkWinCondition(
          getCurrentState(updatedGame),
          updatedGame,
        )
        if (winner) {
          const finalGame = endGame(updatedGame, winner)
          updateGame(finalGame)
          setScreen({ type: 'game_over' })
        } else {
          // Process auto-skips and return to night dashboard
          const readyGame = processAutoSkips(updatedGame)
          updateGame(readyGame)
          setScreen({ type: 'night_dashboard' })
        }
      })
    } else {
      // No intent — check win conditions and return to dashboard
      const winner = checkWinCondition(getCurrentState(newGame), newGame)
      if (winner) {
        const finalGame = endGame(newGame, winner)
        updateGame(finalGame)
        setScreen({ type: 'game_over' })
      } else {
        // Process auto-skips and return to night dashboard
        const readyGame = processAutoSkips(newGame)
        updateGame(readyGame)
        setScreen({ type: 'night_dashboard' })
      }
    }
  }

  const handleNightActionSkip = () => {
    if (screen.type !== 'night_action') return

    const newGame = skipNightAction(
      game,
      screen.roleId,
      screen.playerId,
      screen.systemStepId,
    )
    const readyGame = processAutoSkips(newGame)
    updateGame(readyGame)
    setScreen({ type: 'night_dashboard' })
  }

  const handleStartDay = () => {
    const newGame = startDay(game)
    updateGame(newGame)

    const winner = checkWinCondition(getCurrentState(newGame), newGame)
    if (winner) {
      const finalGame = endGame(newGame, winner)
      updateGame(finalGame)
      setScreen({ type: 'game_over' })
    } else {
      const deaths = getLastNightDeaths(newGame)
      const deadPlayers = deaths
        .map((id) => state.players.find((p) => p.id === id))
        .filter(Boolean)
        .map((p) => ({
          playerId: p!.id,
          playerName: p!.name,
          roleId: p!.roleId,
        }))

      if (deadPlayers.length > 0) {
        // Death reveal goes straight to day — dawn announcement is redundant
        setScreen({
          type: 'death_reveal',
          deaths: deadPlayers,
          next: { type: 'day' },
        })
      } else {
        // No deaths: show dawn screen with "no one died" message
        setScreen({ type: 'dawn', deaths, round: state.round })
      }
    }
  }

  const handleDawnContinue = () => {
    setScreen({ type: 'day' })
  }

  // ========================================================================
  // DAY FLOW
  // ========================================================================

  const handleOpenNomination = () => {
    setScreen({ type: 'nomination' })
  }

  const handleNominate = (nominatorId: string, nomineeId: string) => {
    const newGame = nominate(game, nominatorId, nomineeId)
    updateGame(newGame)

    const newState = getCurrentState(newGame)
    // Check if an effect intercepted (e.g., Virgin killing the nominator)
    const winner = checkWinCondition(newState, newGame)
    if (winner) {
      const finalGame = endGame(newGame, winner)
      updateGame(finalGame)
      setScreen({ type: 'game_over' })
    } else {
      // Check if the virgin killed someone
      const oldPlayerSet = new Set(
        state.players.filter(isAlive).map((p) => p.id),
      )
      const newPlayerSet = new Set(
        newState.players.filter(isAlive).map((p) => p.id),
      )
      const deaths = Array.from(oldPlayerSet).filter(
        (id) => !newPlayerSet.has(id),
      )

      if (deaths.length > 0) {
        const next: Screen = hasVirginExecutionToday(newGame)
          ? { type: 'day' }
          : { type: 'voting', nomineeId, nominatorId }
        const deadPlayers = deaths
          .map((id) => newState.players.find((p) => p.id === id))
          .filter(Boolean)
          .map((p) => ({
            playerId: p!.id,
            playerName: p!.name,
            roleId: p!.roleId,
          }))
        setScreen({ type: 'death_reveal', deaths: deadPlayers, next })
      } else {
        // Show voting screen for this nominee
        setScreen({ type: 'voting', nomineeId, nominatorId })
      }
    }
  }

  const handleVoteComplete = (voteCount: number, votedIds?: string[]) => {
    if (screen.type !== 'voting') return

    const newGame = resolveVote(game, screen.nomineeId, voteCount, votedIds)
    updateGame(newGame)

    // No execution here — deferred to end of day
    setScreen({ type: 'day' })
  }

  const handleEndDay = () => {
    const currentGame = executeAtEndOfDay(game)
    updateGame(currentGame)

    const deaths = getDeathsBetweenStates(
      state.players,
      getCurrentState(currentGame).players,
    )

    maybeFinishDayAndStartNight(currentGame, deaths)
  }

  const handleCancelVote = () => {
    if (screen.type === 'voting') {
      const newGame = cancelNomination(
        game,
        screen.nominatorId,
        screen.nomineeId,
      )
      updateGame(newGame)
    }
    setScreen({ type: 'day' })
  }

  const handleBackFromNomination = () => {
    setScreen({ type: 'day' })
  }

  // ========================================================================
  // GENERIC DAY ACTIONS
  // ========================================================================

  const handleOpenDayAction = (action: AvailableDayAction) => {
    setScreen({ type: 'day_action', action, mode: 'day' })
  }

  const handleDayActionComplete = (result: DayActionResult) => {
    const previousPlayers = state.players
    const changes = {
      entries: result.entries,
      stateUpdates: result.stateUpdates,
      addEffects: result.addEffects,
      removeEffects: result.removeEffects,
      changeAlignments: result.changeAlignments,
      changeRoles: result.changeRoles,
    }
    const finishAction = (updatedGame: Game) => {
      const updatedState = getCurrentState(updatedGame)
      const deaths = getDeathsBetweenStates(
        previousPlayers,
        updatedState.players,
      )

      if (result.winner) {
        const finalGame = endGame(updatedGame, result.winner)
        updateGame(finalGame)
        setScreen({ type: 'game_over' })
        return
      }

      const winner = checkWinCondition(updatedState, updatedGame)
      if (winner) {
        const finalGame = endGame(updatedGame, winner)
        updateGame(finalGame)
        setScreen({ type: 'game_over' })
        return
      }

      if (screen.type === 'day_action' && screen.mode === 'end_day') {
        const nextActions = getPendingResolutionActions(updatedGame)
        if (nextActions.length > 0) {
          const next: Screen = {
            type: 'day_action',
            action: nextActions[0],
            mode: 'end_day',
          }
          if (deaths.length > 0) {
            setScreen({ type: 'death_reveal', deaths, next })
          } else {
            setScreen(next)
          }
          return
        }

        maybeFinishDayAndStartNight(updatedGame, deaths)
        return
      }

      const next: Screen = { type: 'day' }
      if (deaths.length > 0) {
        setScreen({ type: 'death_reveal', deaths, next })
      } else {
        setScreen(next)
      }
    }

    const newGame = applyPipelineChanges(game, changes)
    updateGame(newGame)

    if (result.intent) {
      const pipelineResult = resolveIntent(
        result.intent,
        getCurrentState(newGame),
        newGame,
      )
      processPipelineResult(pipelineResult, newGame, finishAction)
      return
    }

    finishAction(newGame)
  }

  const handleBackFromDayAction = () => {
    if (screen.type === 'day_action' && screen.mode === 'end_day') {
      return
    }
    setScreen({ type: 'day' })
  }

  // ========================================================================
  // NIGHT FOLLOW-UPS
  // ========================================================================

  const handleNightFollowUpComplete = (result: NightFollowUpResult) => {
    const changes = {
      entries: result.entries,
      stateUpdates: result.stateUpdates,
      addEffects: result.addEffects,
      removeEffects: result.removeEffects,
      changeAlignments: result.changeAlignments,
      changeRoles: result.changeRoles,
    }
    const newGame = applyPipelineChanges(game, changes)
    updateGame(newGame)

    if (result.winner) {
      const finalGame = endGame(newGame, result.winner)
      updateGame(finalGame)
      setScreen({ type: 'game_over' })
      return
    }

    const winner = checkWinCondition(getCurrentState(newGame), newGame)
    if (winner) {
      const finalGame = endGame(newGame, winner)
      updateGame(finalGame)
      setScreen({ type: 'game_over' })
      return
    }

    const readyGame = processAutoSkips(newGame)
    updateGame(readyGame)
    setScreen({ type: 'night_dashboard' })
  }

  // ========================================================================
  // OTHER HANDLERS
  // ========================================================================

  const handleOpenEditEffects = (player: PlayerState) => {
    setGrimoireIntent({ view: 'edit_effects', player })
    setShowGrimoire(true)
  }

  const handleAddEffect = (
    playerId: string,
    effectType: string,
    data?: Record<string, unknown>,
  ) => {
    const newGame = addEffectToPlayer(game, playerId, effectType, data)
    updateGame(newGame)
  }

  const handleRemoveEffect = (playerId: string, effectType: string) => {
    const newGame = removeEffectFromPlayer(game, playerId, effectType)
    updateGame(newGame)
  }

  const handleUpdateEffect = (
    playerId: string,
    effectType: string,
    data: Record<string, unknown>,
  ) => {
    const newGame = updateEffectData(game, playerId, effectType, data)
    updateGame(newGame)
  }

  const handleShowRoleCard = (player: PlayerState) => {
    setShowGrimoire(false)
    setScreen({
      type: 'grimoire_role_card',
      playerId: player.id,
      returnTo: screen,
    })
  }

  const handleRoleCardClose = () => {
    if (screen.type === 'grimoire_role_card') {
      setScreen(screen.returnTo)
    }
  }

  const handleSwapPlayers = (
    sourcePlayerId: string,
    targetPlayerId: string,
  ) => {
    const currentPlayers = getCurrentState(game).players
    const sourceIndex = currentPlayers.findIndex(
      (player) => player.id === sourcePlayerId,
    )
    const targetIndex = currentPlayers.findIndex(
      (player) => player.id === targetPlayerId,
    )

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
      return

    const nextOrder = [...currentPlayers.map((player) => player.id)]
    ;[nextOrder[sourceIndex], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[sourceIndex],
    ]

    const newGame = reorderPlayers(game, nextOrder)
    updateGame(newGame)
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  if (showHistory) {
    return (
      <div className='relative'>
        <HistoryView game={game} onClose={() => setShowHistory(false)} />
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      </div>
    )
  }

  if (showRolesLibrary) {
    return (
      <div className='relative'>
        <RolesLibrary
          selectedRoleId={selectedLibraryRoleId}
          roleIds={libraryRoleIds}
          onBack={() => {
            setSelectedLibraryRoleId(null)
            setShowRolesLibrary(false)
          }}
          onSelectRole={(roleId) => setSelectedLibraryRoleId(roleId)}
          onDeselectRole={() => setSelectedLibraryRoleId(null)}
        />
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      </div>
    )
  }

  if (showNotes) {
    return (
      <div className='relative'>
        <StorytellerNotesView
          notes={game.storytellerNotes ?? ''}
          onChange={(storytellerNotes) =>
            updateGame({
              ...game,
              storytellerNotes,
            })
          }
          onClose={() => setShowNotes(false)}
          onShowHistory={() => {
            setShowNotes(false)
            setShowHistory(true)
          }}
        />
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      </div>
    )
  }

  const renderScreen = () => {
    switch (screen.type) {
      case 'night_prep':
        return (
          <NightPrepScreen
            game={game}
            state={state}
            items={pendingNightPrepItems}
            completedItems={completedNightPrepItems}
            onOpenSetup={handleOpenNightPrepAction}
            onOpenPlayer={(playerId) => {
              const player = getPlayer(state, playerId)
              if (!player) return
              setGrimoireIntent({ view: 'player_detail', player })
              setShowGrimoire(true)
            }}
            onSwapPlayers={handleSwapPlayers}
            onContinue={handleNightPrepContinue}
          />
        )

      case 'night_prep_action': {
        const prepPlayer = getPlayer(state, screen.playerId)
        if (!prepPlayer) return null
        const prepRole = getRole(screen.roleId)
        if (!prepRole) return null

        if (shouldUseNightPrepSetupAction(prepRole.id)) {
          if (!prepRole.SetupAction) return null

          return (
            <prepRole.SetupAction
              player={prepPlayer}
              state={state}
              onComplete={(result) =>
                handleNightPrepSetupComplete(prepPlayer.id, result)
              }
            />
          )
        }

        if (!prepRole.NightAction) return null

        const PrepAction = prepRole.NightAction as FC<any>

        return (
          <PrepAction
            game={game}
            state={state}
            player={prepPlayer}
            mode='prepare'
            onComplete={(result: NightActionResult) =>
              handleNightPrepComplete(prepPlayer.id, prepRole.id, result)
            }
          />
        )
      }

      case 'setup_actions':
        return (
          <SetupActionsScreen
            game={game}
            state={state}
            onOpenSetupAction={handleOpenSetupAction}
            onContinue={handleSetupActionsContinue}
            onShowRoleCard={handleShowRoleCard}
            onEditEffects={handleOpenEditEffects}
          />
        )

      case 'setup_action': {
        const setupPlayer = getPlayer(state, screen.playerId)
        if (!setupPlayer) return null
        const setupRole = getRole(screen.roleId)
        if (!setupRole?.SetupAction) return null

        return (
          <setupRole.SetupAction
            player={setupPlayer}
            state={state}
            onComplete={handleSetupActionComplete}
          />
        )
      }

      case 'role_revelation':
        return (
          <RoleRevelationScreen
            game={game}
            state={state}
            onRevealRole={handleRevealRole}
            onStartNight={handleStartFirstNight}
            onMainMenu={onMainMenu}
          />
        )

      case 'showing_role': {
        const player = getPlayer(state, screen.playerId)
        if (!player) return null
        const role = getRole(player.roleId)
        if (!role) return null

        return (
          <PlayerFacingScreen playerName={player.name}>
            <role.RoleReveal
              player={player}
              onContinue={handleRoleRevealDismiss}
            />
          </PlayerFacingScreen>
        )
      }

      case 'night_dashboard':
        return (
          <NightDashboard
            game={game}
            state={state}
            onOpenNightAction={handleOpenNightAction}
            onReplayNightAction={handleReplayNightAction}
            onRerunSkippedNightAction={(playerId, roleId, systemStepId) => {
              setScreen({
                type: 'night_action',
                playerId,
                roleId,
                systemStepId,
              })
            }}
            onSkipNightAction={(playerId, roleId, systemStepId) => {
              const newGame = skipNightAction(
                game,
                roleId,
                playerId,
                systemStepId,
              )
              const readyGame = processAutoSkips(newGame)
              updateGame(readyGame)
              setScreen({ type: 'night_dashboard' })
            }}
            onOpenNightFollowUp={handleOpenNightFollowUp}
            onStartDay={handleStartDay}
            onMainMenu={onMainMenu}
            onShowRoleCard={handleShowRoleCard}
            onEditEffects={handleOpenEditEffects}
            onOpenGrimoirePlayer={(player) => {
              setGrimoireIntent({ view: 'player_detail', player })
              setShowGrimoire(true)
            }}
          />
        )

      case 'night_follow_up': {
        const FollowUpComponent = screen.followUp.ActionComponent
        return (
          <FollowUpComponent
            state={state}
            game={game}
            playerId={screen.followUp.playerId}
            onComplete={handleNightFollowUpComplete}
          />
        )
      }

      case 'night_action': {
        if (screen.systemStepId) {
          return (
            <NightSystemActionScreen
              game={game}
              state={state}
              playerId={screen.playerId}
              roleId={screen.roleId}
              systemStepId={screen.systemStepId}
              onComplete={handleNightActionComplete}
            />
          )
        }

        const player = getPlayer(state, screen.playerId)
        if (!player) return null
        const role = getRole(screen.roleId)
        if (!role) return null

        if (!role.NightAction) {
          handleNightActionSkip()
          return null
        }

        return (
          <role.NightAction
            game={game}
            state={state}
            player={player}
            onComplete={handleNightActionComplete}
            onOpenGrimoire={(intent, readOnly) => {
              setGrimoireIntent({ ...intent, readOnly })
              setShowGrimoire(true)
            }}
          />
        )
      }

      case 'night_action_replay':
        return (
          <NightActionReplayScreen
            game={game}
            state={state}
            playerId={screen.playerId}
            roleId={screen.roleId}
            systemStepId={screen.systemStepId}
            onBack={() => setScreen({ type: 'night_dashboard' })}
          />
        )

      case 'dawn':
        return (
          <DawnScreen
            state={state}
            deaths={screen.deaths}
            round={screen.round}
            onContinue={handleDawnContinue}
          />
        )

      case 'death_reveal':
        return (
          <DeathRevealScreen
            deaths={screen.deaths}
            onContinue={() => setScreen(screen.next)}
          />
        )

      case 'day': {
        // Collect available day actions from active effects
        const dayActions = getAvailableDayActions(state, t)
        const deaths = getLastNightDeaths(game)

        return (
          <DayPhase
            state={state}
            blockStatus={getBlockStatus(game)}
            dayActions={dayActions}
            nightSummary={{ deaths, round: state.round - 1 || state.round }}
            nominationsBlocked={hasVirginExecutionToday(game)}
            onNominate={handleOpenNomination}
            onDayAction={handleOpenDayAction}
            onEndDay={handleEndDay}
            onMainMenu={onMainMenu}
            onShowRoleCard={handleShowRoleCard}
            onEditEffects={handleOpenEditEffects}
            onOpenGrimoirePlayer={(player) => {
              setGrimoireIntent({ view: 'player_detail', player })
              setShowGrimoire(true)
            }}
          />
        )
      }

      case 'day_action': {
        const ActionComponent = screen.action.ActionComponent
        return (
          <ActionComponent
            state={state}
            playerId={screen.action.playerId}
            onComplete={handleDayActionComplete}
            onBack={handleBackFromDayAction}
          />
        )
      }

      case 'pipeline_input': {
        if (!pipelineUI) return null
        const PipelineComponent = pipelineUI.Component
        return (
          <PipelineComponent
            state={state}
            intent={pipelineUI.intent}
            onComplete={pipelineUI.onResult}
          />
        )
      }

      case 'grimoire_role_card': {
        const player = getPlayer(state, screen.playerId)
        if (!player) return null
        const cardRole = getRole(player.roleId)
        const cardTeamId = cardRole?.team ?? 'townsfolk'
        const cardTeam = getTeam(cardTeamId)
        return (
          <TeamBackground teamId={cardTeamId}>
            <RoleCard roleId={player.roleId} />
            <CardLink onClick={handleRoleCardClose} isEvil={cardTeam.isEvil}>
              {t.common.back}
            </CardLink>
          </TeamBackground>
        )
      }

      case 'nomination':
        return (
          <NominationScreen
            state={state}
            nominatorsToday={getNominatorsToday(game)}
            nomineesToday={getNomineesToday(game)}
            onNominate={handleNominate}
            onBack={handleBackFromNomination}
          />
        )

      case 'voting':
        return (
          <VotingPhase
            state={state}
            nomineeId={screen.nomineeId}
            blockStatus={getBlockStatus(game)}
            onVoteComplete={handleVoteComplete}
            onCancel={handleCancelVote}
          />
        )

      case 'game_over':
        return (
          <GameOver
            state={state}
            onMainMenu={onMainMenu}
            onShowHistory={() => setShowHistory(true)}
          />
        )

      default:
        return null
    }
  }

  // Floating buttons are shown everywhere except:
  // - game_over: dedicated summary screen
  // - grimoire_role_card: full-screen role card overlay
  // - when a child component signals it's player-facing (via PlayerFacingScreen)
  const showFloatingButtons =
    screen.type !== 'game_over' &&
    screen.type !== 'grimoire_role_card' &&
    !isPlayerFacing

  return (
    <div className='relative'>
      <PlayerFacingContext.Provider value={playerFacingCtx}>
        {renderScreen()}
      </PlayerFacingContext.Provider>

      {/* Floating Language Toggle */}
      <div className='fixed top-4 right-4 z-50'>
        <LanguagePicker variant='floating' />
      </div>

      {/* Floating storyteller tools */}
      {showFloatingButtons && (
        <div className='fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col gap-2'>
          {screen.type === 'night_action' && (
            <button
              onClick={handleNightActionSkip}
              className='w-12 h-12 rounded-full bg-amber-900/90 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg hover:bg-amber-900 hover:border-amber-400/60 transition-colors'
              title={t.game.skipNightAction}
            >
              <Icon name='zapOff' size='md' />
            </button>
          )}

          <StorytellerFabMenu
            onShowGrimoire={() => {
              setGrimoireIntent({ view: 'list' })
              setShowGrimoire(true)
            }}
            onShowCharacters={() => {
              setSelectedLibraryRoleId(null)
              setShowRolesLibrary(true)
            }}
            onTakeNotes={() => setShowNotes(true)}
            onShowHistory={() => setShowHistory(true)}
          />
        </div>
      )}

      {/* Grimoire Modal — unified player list, detail, edit effects, effect config */}
      <GrimoireModal
        state={state}
        open={showGrimoire}
        onClose={() => setShowGrimoire(false)}
        intent={grimoireIntent}
        onShowRoleCard={handleShowRoleCard}
        onAddEffect={handleAddEffect}
        onRemoveEffect={handleRemoveEffect}
        onUpdateEffect={handleUpdateEffect}
      />
    </div>
  )
}

function hasSetupActions(game: Game): boolean {
  const state = getCurrentState(game)
  // Check if any player's current role has a SetupAction that hasn't been completed yet
  const completedSetupPlayerIds = new Set(
    game.history
      .filter((e) => e.type === 'setup_action')
      .map((e) => e.data.playerId as string),
  )

  return state.players.some((p) => {
    if (completedSetupPlayerIds.has(p.id)) return false
    const role = getRole(p.roleId)
    return role?.SetupAction != null
  })
}

const NIGHT_PREP_PREPARED_ACTION_ROLE_IDS = new Set([
  'washerwoman',
  'librarian',
  'investigator',
  'chef',
  'imp',
])

function hasPendingNightPrep(game: Game): boolean {
  if (getCurrentState(game).phase !== 'night') return false
  if (getCurrentState(game).round !== 1) return false

  return getPendingNightPrepItems(game).length > 0
}

function getNightEntryScreen(game: Game): Screen {
  const state = getCurrentState(game)

  if (state.phase !== 'night') return { type: 'day' }
  if (hasPendingNightPrep(game)) {
    return { type: 'night_prep' }
  }
  return { type: 'night_dashboard' }
}

function hasRecordedSetupAction(
  game: Game,
  playerId: string,
  roleId: string,
): boolean {
  for (let i = game.history.length - 1; i >= 0; i--) {
    const entry = game.history[i]
    if (entry.type !== 'setup_action') continue
    if (entry.data.playerId !== playerId) continue
    if (entry.data.roleId !== roleId) continue
    if (entry.data.preparedNightAction) continue

    return true
  }

  return false
}

function shouldUseNightPrepSetupAction(roleId: string): boolean {
  const role = getRole(roleId)
  if (!role?.SetupAction) return false
  if (role.id === 'drunk') return false
  if (NIGHT_PREP_PREPARED_ACTION_ROLE_IDS.has(roleId)) return false

  return true
}

function shouldUsePreparedNightActionPrep(
  game: Game,
  player: PlayerState,
  roleId: string,
): boolean {
  if (!NIGHT_PREP_PREPARED_ACTION_ROLE_IDS.has(roleId)) return false
  if (getPreparedNightActionData(game, player.id, roleId)) return false

  if (roleId === 'chef') {
    const state = getCurrentState(game)
    const hasAmbiguousAlignment =
      getAmbiguousPlayers(state.players.filter(isAlive), 'alignment').length > 0

    return isMalfunctioning(player) || hasAmbiguousAlignment
  }

  return true
}

function getPendingNightPrepItems(game: Game): NightPrepItem[] {
  const state = getCurrentState(game)

  return state.players.flatMap<NightPrepItem>((player) => {
    const role = getRole(player.roleId)
    if (!role) return []
    if (
      shouldUseNightPrepSetupAction(role.id) &&
      !hasRecordedSetupAction(game, player.id, role.id)
    ) {
      return [
        {
          playerId: player.id,
          playerName: player.name,
          roleId: role.id,
          roleIcon: role.icon,
        },
      ]
    }
    if (!shouldUsePreparedNightActionPrep(game, player, role.id)) return []

    return [
      {
        playerId: player.id,
        playerName: player.name,
        roleId: role.id,
        roleIcon: role.icon,
      },
    ]
  })
}

function getCompletedNightPrepItems(
  game: Game,
  language: Language,
  t: Translations,
): NightPrepSummaryItem[] {
  const state = getCurrentState(game)

  return state.players.flatMap<NightPrepSummaryItem>((player) => {
    const role = getRole(player.roleId)
    if (!role) return []

    if (role.id !== 'drunk' && role.SetupAction) {
      if (!hasRecordedSetupAction(game, player.id, role.id)) return []

      if (role.id === 'fortune_teller') {
        const redHerringPlayer = state.players.find((candidate) =>
          candidate.effects.some(
            (effect) =>
              effect.type === 'red_herring' &&
              effect.data?.fortuneTellerId === player.id,
          ),
        )

        return [
          {
            playerId: player.id,
            playerName: player.name,
            roleId: role.id,
            roleIcon: role.icon,
            details: [
              `${t.game.nightPrepRedHerring}: ${
                redHerringPlayer?.name ?? t.ui.unknownPlayer
              }`,
            ],
          },
        ]
      }
    }

    if (!NIGHT_PREP_PREPARED_ACTION_ROLE_IDS.has(role.id)) return []

    if (role.id === 'chef') {
      const preparedData = getPreparedNightActionData<{
        evilPairs: number
      }>(game, player.id, role.id)
      if (!preparedData) return []

      return [
        {
          playerId: player.id,
          playerName: player.name,
          roleId: role.id,
          roleIcon: role.icon,
          details: [
            interpolate(t.game.nightPrepEvilPairs, {
              count: preparedData.evilPairs,
            }),
          ],
        },
      ]
    }

    if (role.id === 'imp') {
      const preparedData = getPreparedNightActionData<{
        bluffRoleIds: string[]
      }>(game, player.id, role.id)
      if (!preparedData) return []

      return [
        {
          playerId: player.id,
          playerName: player.name,
          roleId: role.id,
          roleIcon: role.icon,
          details: preparedData.bluffRoleIds.map((bluffRoleId) =>
            getRoleName(bluffRoleId, language),
          ),
        },
      ]
    }

    const preparedData = getPreparedNightActionData<{
      action: 'see_target' | 'no_target'
      shownPlayers?: string[]
      shownRoleId?: string
    }>(game, player.id, role.id)
    if (!preparedData) return []

    if (preparedData.action === 'no_target') {
      return [
        {
          playerId: player.id,
          playerName: player.name,
          roleId: role.id,
          roleIcon: role.icon,
          details: [t.game.nightPrepNoTarget],
        },
      ]
    }

    const shownPlayerNames = (preparedData.shownPlayers ?? [])
      .map(
        (shownPlayerId) =>
          state.players.find((candidate) => candidate.id === shownPlayerId)
            ?.name ?? t.ui.unknownPlayer,
      )
      .join(', ')

    const details = [shownPlayerNames]
    if (preparedData.shownRoleId) {
      details.push(getRoleName(preparedData.shownRoleId, language))
    }

    return [
      {
        playerId: player.id,
        playerName: player.name,
        roleId: role.id,
        roleIcon: role.icon,
        details,
      },
    ]
  })
}

function getInitialScreen(game: Game): Screen {
  const state = getCurrentState(game)

  // Check win conditions
  if (state.phase === 'ended') {
    return { type: 'game_over' }
  }

  if (state.phase !== 'setup') {
    const winner = checkWinCondition(state, game)
    if (winner) {
      return { type: 'game_over' }
    }
  }

  switch (state.phase) {
    case 'setup':
      // Check if there are pending setup actions (e.g., Drunk choosing believed role)
      if (hasSetupActions(game)) {
        return { type: 'setup_actions' }
      }
      return { type: 'role_revelation' }
    case 'night':
      return getNightEntryScreen(game)
    case 'day':
      return { type: 'day' }
    default:
      return { type: 'day' }
  }
}
