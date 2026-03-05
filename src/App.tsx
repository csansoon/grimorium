import { useEffect, useMemo, useState } from 'react'
import {
  createGame,
  PlayerSetup,
  applySetupAction,
  markRoleRevealed,
  startNight,
  processAutoSkips,
} from './lib/game'
import { getCurrentState } from './lib/types'
import {
  saveGame,
  setCurrentGameId,
  getGame,
  clearCurrentGame,
} from './lib/storage'
import {
  MainMenu,
  PlayerEntry,
  ScriptSelection,
  ScriptImportScreen,
  ScriptWakeOrderEditor,
  RoleSelection,
  RoleDeal,
  GameScreen,
  RolesLibrary,
  HowToPlayScreen,
} from './components/screens'
import { LanguagePicker } from './components/atoms'
import { useRouter } from './hooks/useRouter'
import { RoleId } from './lib/roles/types'
import { getRole } from './lib/roles'
import {
  ScriptId,
  EditableScriptDraft,
  getScript,
  saveScript,
  type SavedScriptDefinition,
  deriveScriptWakeOrderFromRoleIds,
} from './lib/scripts'
import { PreparedRoleAssignment } from './components/screens/RoleDeal'
import { generateId } from './lib/types'

// Internal screens for the new-game wizard (not routed — stays on "/")
type NewGameScreen =
  | { type: 'new_game_players'; playerCount?: number }
  | { type: 'new_game_script'; playerCount: number }
  | { type: 'new_game_import_script'; playerCount: number }
  | { type: 'new_game_roles'; playerCount: number; scriptId: ScriptId }
  | {
    type: 'new_game_wake_order'
    playerCount: number
    draftScript: EditableScriptDraft
    nextStep: 'script_list' | 'roles' | 'deal'
    selectedRoles?: string[]
  }
  | {
    type: 'new_game_deal'
    playerCount: number
    scriptId: ScriptId
    selectedRoles: string[]
  }

function makeSeatLabels(playerCount: number): string[] {
  return Array.from({ length: playerCount }, (_, index) => `Seat ${index + 1}`)
}

function App() {
  const { path, navigate, replace } = useRouter()

  // New-game wizard state (lives entirely on the "/" route)
  const [newGameScreen, setNewGameScreen] = useState<NewGameScreen | null>(null)

  // Parse route segments once
  const segments = useMemo(() => path.split('/').filter(Boolean), [path])

  const routeType = segments[0] ?? 'home'

  // ========================================================================
  // Side effects for route changes
  // ========================================================================

  // Redirect invalid /game/:id to /
  useEffect(() => {
    if (routeType === 'game' && segments[1]) {
      const game = getGame(segments[1])
      if (!game) {
        replace('/')
      }
    }
  }, [routeType, segments, replace])

  // Track current game ID in localStorage
  useEffect(() => {
    if (routeType === 'game' && segments[1]) {
      const game = getGame(segments[1])
      if (game) {
        setCurrentGameId(segments[1])
      }
    }
  }, [routeType, segments])

  // Clear new-game wizard when navigating away from home
  useEffect(() => {
    if (routeType !== 'home') {
      setNewGameScreen(null)
    }
  }, [routeType])

  // ========================================================================
  // New-game wizard handlers
  // ========================================================================

  const handleNewGame = () => {
    setNewGameScreen({ type: 'new_game_players' })
  }

  const handlePlayerCountNext = (playerCount: number) => {
    setNewGameScreen({ type: 'new_game_script', playerCount })
  }

  const handleScriptNext = (playerCount: number, scriptId: ScriptId) => {
    setNewGameScreen({ type: 'new_game_roles', playerCount, scriptId })
  }

  const handleImportDraft = (playerCount: number, draftScript: EditableScriptDraft) => {
    setNewGameScreen({
      type: 'new_game_wake_order',
      playerCount,
      draftScript,
      nextStep: 'roles',
    })
  }

  const handleEditSavedScript = (playerCount: number, scriptId: ScriptId) => {
    const script = getScript(scriptId)
    if (!script || script.isOfficial) return

    setNewGameScreen({
      type: 'new_game_wake_order',
      playerCount,
      draftScript: {
        id: script.id,
        source: script.source === 'builtin' ? 'custom' : script.source,
        name: script.name,
        author: script.author,
        icon: script.icon,
        roles: script.roles,
        enforceDistribution: script.enforceDistribution,
        wakeOrder: script.wakeOrder,
      },
      nextStep: 'script_list',
    })
  }

  const handleRolesNext = (
    playerCount: number,
    scriptId: ScriptId,
    selectedRoles: string[],
  ) => {
    if (scriptId === 'custom') {
      const uniqueRoles = Array.from(
        new Set(selectedRoles.filter((roleId): roleId is RoleId => !!getRole(roleId))),
      )
      const defaultName = `Custom Script ${new Date().toLocaleDateString()}`
      setNewGameScreen({
        type: 'new_game_wake_order',
        playerCount,
        draftScript: {
          source: 'custom',
          name: defaultName,
          icon: 'settings',
          author: undefined,
          roles: uniqueRoles,
          enforceDistribution: true,
          wakeOrder: deriveScriptWakeOrderFromRoleIds(uniqueRoles),
        },
        nextStep: 'deal',
        selectedRoles,
      })
      return
    }

    setNewGameScreen({
      type: 'new_game_deal',
      playerCount,
      scriptId,
      selectedRoles,
    })
  }

  const handleSaveWakeOrder = (
    playerCount: number,
    draftScript: EditableScriptDraft,
    nextStep: 'script_list' | 'roles' | 'deal',
    selectedRoles?: string[],
  ) => {
    const savedScript: SavedScriptDefinition = {
      id: draftScript.id ?? `script_${generateId()}`,
      source: draftScript.source,
      name: draftScript.name,
      author: draftScript.author,
      icon: draftScript.icon,
      roles: draftScript.roles,
      enforceDistribution: draftScript.enforceDistribution,
      wakeOrder: draftScript.wakeOrder,
      isOfficial: false,
    }

    saveScript(savedScript)

    if (nextStep === 'roles') {
      setNewGameScreen({
        type: 'new_game_roles',
        playerCount,
        scriptId: savedScript.id,
      })
      return
    }

    if (nextStep === 'deal' && selectedRoles) {
      setNewGameScreen({
        type: 'new_game_deal',
        playerCount,
        scriptId: savedScript.id,
        selectedRoles,
      })
      return
    }

    setNewGameScreen({
      type: 'new_game_script',
      playerCount,
    })
  }

  const handleStartGame = (
    preparedAssignments: PreparedRoleAssignment[],
    scriptId: ScriptId,
  ) => {
    const script = getScript(scriptId)
    const players: PlayerSetup[] = preparedAssignments.map((assignment) => ({
      name: assignment.playerName,
      roleId: assignment.baseRoleId,
    }))

    const gameName = `Game ${new Date().toLocaleDateString()}`
    let game = createGame(gameName, scriptId, players, script)

    preparedAssignments.forEach((assignment, index) => {
      const currentState = getCurrentState(game)
      const player = currentState.players[index]
      if (!player) return

      if (assignment.autoSetup.kind === 'drunk') {
        if (!assignment.autoSetup.believedRoleId) return

        game = applySetupAction(game, player.id, {
          changeRole: assignment.autoSetup.believedRoleId,
          addEffects: {
            [player.id]: [
              {
                type: 'drunk',
                data: { actualRole: 'drunk' },
                expiresAt: 'never',
              },
            ],
          },
        })
      }

    })

    getCurrentState(game).players.forEach((player) => {
      game = markRoleRevealed(game, player.id)
    })

    game = processAutoSkips(startNight(game))

    saveGame(game)
    setCurrentGameId(game.id)
    setNewGameScreen(null)

    navigate(`/game/${game.id}`)
  }

  const handleBackToMenu = () => {
    setNewGameScreen(null)
  }

  // ========================================================================
  // Route: /game/:id
  // ========================================================================

  if (routeType === 'game' && segments[1]) {
    const gameId = segments[1]
    const game = getGame(gameId)
    if (!game) {
      // The useEffect above will redirect; render nothing until then
      return null
    }
    return (
      <GameScreen
        key={gameId}
        initialGame={game}
        onMainMenu={() => {
          clearCurrentGame()
          navigate('/')
        }}
      />
    )
  }

  // ========================================================================
  // Route: /roles and /roles/:roleId
  // ========================================================================

  if (routeType === 'roles') {
    const candidateRoleId = segments[1] ?? null
    // Validate roleId — fall back to list view if invalid
    const selectedRoleId =
      candidateRoleId && getRole(candidateRoleId as RoleId)
        ? (candidateRoleId as RoleId)
        : null

    // If the URL has an invalid role ID, clean it up
    if (candidateRoleId && !selectedRoleId) {
      replace('/roles')
    }

    return (
      <div className='relative'>
        <RolesLibrary
          selectedRoleId={selectedRoleId}
          onBack={() => navigate('/')}
          onSelectRole={(id) => navigate(`/roles/${id}`)}
          onDeselectRole={() => navigate('/roles')}
        />
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      </div>
    )
  }

  // ========================================================================
  // Route: /how-to-play
  // ========================================================================

  if (routeType === 'how-to-play') {
    return (
      <div className='relative'>
        <HowToPlayScreen onBack={() => navigate('/')} />
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      </div>
    )
  }

  // ========================================================================
  // Route: / (home — main menu + new-game wizard)
  // ========================================================================

  // Redirect unknown routes to home
  if (routeType !== 'home') {
    replace('/')
    return null
  }

  const renderHome = () => {
    // New-game wizard (internal to "/" route)
    if (newGameScreen) {
      switch (newGameScreen.type) {
        case 'new_game_players':
          return (
            <PlayerEntry
              initialPlayerCount={newGameScreen.playerCount}
              onNext={handlePlayerCountNext}
              onBack={handleBackToMenu}
            />
          )

        case 'new_game_script':
          return (
            <ScriptSelection
              playerCount={newGameScreen.playerCount}
              onSelect={(scriptId) =>
                handleScriptNext(newGameScreen.playerCount, scriptId)
              }
              onImport={() =>
                setNewGameScreen({
                  type: 'new_game_import_script',
                  playerCount: newGameScreen.playerCount,
                })
              }
              onEditScript={(scriptId) =>
                handleEditSavedScript(newGameScreen.playerCount, scriptId)
              }
              onBack={() =>
                setNewGameScreen({
                  type: 'new_game_players',
                  playerCount: newGameScreen.playerCount,
                })
              }
            />
          )

        case 'new_game_import_script':
          return (
            <ScriptImportScreen
              playerCount={newGameScreen.playerCount}
              onResolved={(draftScript) =>
                handleImportDraft(newGameScreen.playerCount, draftScript)
              }
              onBack={() =>
                setNewGameScreen({
                  type: 'new_game_script',
                  playerCount: newGameScreen.playerCount,
                })
              }
            />
          )

        case 'new_game_roles':
          return (
            <RoleSelection
              players={makeSeatLabels(newGameScreen.playerCount)}
              scriptId={newGameScreen.scriptId}
              onNext={(selectedRoles) =>
                handleRolesNext(
                  newGameScreen.playerCount,
                  newGameScreen.scriptId,
                  selectedRoles,
                )
              }
              onBack={() =>
                setNewGameScreen({
                  type: 'new_game_script',
                  playerCount: newGameScreen.playerCount,
                })
              }
            />
          )

        case 'new_game_wake_order':
          return (
            <ScriptWakeOrderEditor
              playerCount={newGameScreen.playerCount}
              draftScript={newGameScreen.draftScript}
              onSave={(draftScript) =>
                handleSaveWakeOrder(
                  newGameScreen.playerCount,
                  draftScript,
                  newGameScreen.nextStep,
                  newGameScreen.selectedRoles,
                )
              }
              onBack={() => {
                if (newGameScreen.nextStep === 'deal' && newGameScreen.selectedRoles) {
                  setNewGameScreen({
                    type: 'new_game_roles',
                    playerCount: newGameScreen.playerCount,
                    scriptId: 'custom',
                  })
                  return
                }

                if (newGameScreen.nextStep === 'roles') {
                  setNewGameScreen({
                    type: 'new_game_import_script',
                    playerCount: newGameScreen.playerCount,
                  })
                  return
                }

                setNewGameScreen({
                  type: 'new_game_script',
                  playerCount: newGameScreen.playerCount,
                })
              }}
            />
          )

        case 'new_game_deal':
          return (
            <RoleDeal
              playerCount={newGameScreen.playerCount}
              scriptId={newGameScreen.scriptId}
              selectedRoles={newGameScreen.selectedRoles}
              onComplete={(assignments) =>
                handleStartGame(assignments, newGameScreen.scriptId)
              }
              onBack={() =>
                setNewGameScreen({
                  type: 'new_game_roles',
                  playerCount: newGameScreen.playerCount,
                  scriptId: newGameScreen.scriptId,
                })
              }
            />
          )
      }
    }

    // Main menu
    return (
      <MainMenu
        onNewGame={handleNewGame}
        onContinue={(gameId) => navigate(`/game/${gameId}`)}
        onLoadGame={(gameId) => navigate(`/game/${gameId}`)}
        onRolesLibrary={() => navigate('/roles')}
        onHowToPlay={() => navigate('/how-to-play')}
      />
    )
  }

  return (
    <div className='relative'>
      {renderHome()}
      <div className='fixed top-4 right-4 z-50'>
        <LanguagePicker variant='floating' />
      </div>
    </div>
  )
}

export default App
