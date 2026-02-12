import { useEffect, useMemo, useState } from 'react'
import { createGame, PlayerSetup } from './lib/game'
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
  RoleSelection,
  RoleAssignment,
  GameScreen,
  RolesLibrary,
} from './components/screens'
import { LanguagePicker } from './components/atoms'
import { useRouter } from './hooks/useRouter'
import { RoleId } from './lib/roles/types'
import { getRole } from './lib/roles'
import { ScriptId } from './lib/scripts'

// Internal screens for the new-game wizard (not routed — stays on "/")
type NewGameScreen =
  | { type: 'new_game_players' }
  | { type: 'new_game_script'; players: string[] }
  | { type: 'new_game_roles'; players: string[]; scriptId: ScriptId }
  | {
      type: 'new_game_assign'
      players: string[]
      scriptId: ScriptId
      selectedRoles: string[]
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

  const handlePlayersNext = (players: string[]) => {
    setNewGameScreen({ type: 'new_game_script', players })
  }

  const handleScriptNext = (players: string[], scriptId: ScriptId) => {
    setNewGameScreen({ type: 'new_game_roles', players, scriptId })
  }

  const handleRolesNext = (
    players: string[],
    scriptId: ScriptId,
    selectedRoles: string[],
  ) => {
    setNewGameScreen({
      type: 'new_game_assign',
      players,
      scriptId,
      selectedRoles,
    })
  }

  const handleStartGame = (
    roleAssignments: { name: string; roleId: string }[],
  ) => {
    const players: PlayerSetup[] = roleAssignments.map((a) => ({
      name: a.name,
      roleId: a.roleId,
    }))

    const gameName = `Game ${new Date().toLocaleDateString()}`
    const game = createGame(gameName, players)

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
            <PlayerEntry onNext={handlePlayersNext} onBack={handleBackToMenu} />
          )

        case 'new_game_script':
          return (
            <ScriptSelection
              players={newGameScreen.players}
              onSelect={(scriptId) =>
                handleScriptNext(newGameScreen.players, scriptId)
              }
              onBack={() => setNewGameScreen({ type: 'new_game_players' })}
            />
          )

        case 'new_game_roles':
          return (
            <RoleSelection
              players={newGameScreen.players}
              scriptId={newGameScreen.scriptId}
              onNext={(selectedRoles) =>
                handleRolesNext(
                  newGameScreen.players,
                  newGameScreen.scriptId,
                  selectedRoles,
                )
              }
              onBack={() =>
                setNewGameScreen({
                  type: 'new_game_script',
                  players: newGameScreen.players,
                })
              }
            />
          )

        case 'new_game_assign':
          return (
            <RoleAssignment
              players={newGameScreen.players}
              selectedRoles={newGameScreen.selectedRoles}
              onStart={handleStartGame}
              onBack={() =>
                setNewGameScreen({
                  type: 'new_game_roles',
                  players: newGameScreen.players,
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
