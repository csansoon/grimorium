import { useState, useMemo } from 'react'
import { RoleDefinition } from '../../../types'
import { getRole } from '../../../index'
import { getTeam } from '../../../../teams'
import {
  useI18n,
  interpolate,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { Game, PlayerState } from '../../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { RoleCard } from '../../../../../components/items/RoleCard'
import { PerceptionConfigStep } from '../../../../../components/items'
import {
  TeamBackground,
} from '../../../../../components/items/TeamBackground'
import {
  NightActionLayout,
  NightStepListLayout,
  PlayerFacingScreen,
  HandbackCardLink,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import {
  perceive,
  getAmbiguousPlayers,
  applyPerceptionOverrides,
} from '../../../../pipeline'
import { isMalfunctioning } from '../../../../effects'
import { MalfunctionConfigStep } from '../../../../../components/items'
import { Perception } from '../../../../pipeline/types'
import { cn } from '../../../../../lib/utils'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('ravenkeeper', 'en', en)
registerRoleTranslations('ravenkeeper', 'es', es)

// Helper to check if a player was actually killed this night.
// Compares the player's state at night start vs now — if they gained
// the "dead" effect since the night began, they were killed this night.
// This correctly ignores prevented kills (e.g., Monk protection).
function wasKilledThisNight(game: Game, playerId: string): boolean {
  // Find the night_started entry
  let nightStartEntry = null
  for (let i = game.history.length - 1; i >= 0; i--) {
    if (game.history[i].type === 'night_started') {
      nightStartEntry = game.history[i]
      break
    }
  }
  if (!nightStartEntry) return false

  // Check if player was alive at night start
  const playerAtNightStart = nightStartEntry.stateAfter.players.find(
    (p) => p.id === playerId,
  )
  if (!playerAtNightStart) return false
  const wasAlive = !playerAtNightStart.effects.some((e) => e.type === 'dead')
  if (!wasAlive) return false

  // Check if player is dead now
  const currentState = game.history.at(-1)?.stateAfter
  if (!currentState) return false
  const playerNow = currentState.players.find((p) => p.id === playerId)
  if (!playerNow) return false

  return playerNow.effects.some((e) => e.type === 'dead')
}

type Phase =
  | 'step_list'
  | 'select_player'
  | 'configure_malfunction'
  | 'configure_perceptions'
  | 'show_role'

const definition: RoleDefinition = {
  id: 'ravenkeeper',
  team: 'townsfolk',
  icon: 'birdHouse',
  nightOrder: 35,
  chaos: 30,

  shouldWake: (game: Game, player: PlayerState) => {
    const round = game.history.at(-1)?.stateAfter.round ?? 0
    if (round <= 1) return false
    return wasKilledThisNight(game, player.id)
  },

  nightSteps: [
    {
      id: 'select_player',
      icon: 'user',
      getLabel: (t) => t.game.stepSelectPlayer,
      audience: 'player_choice',
    },
    {
      id: 'show_role',
      icon: 'birdHouse',
      getLabel: (t) => t.game.stepShowRole,
      audience: 'player_reveal',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
    const [perceptionOverrides, setPerceptionOverrides] = useState<
      Record<string, Partial<Perception>>
    >({})
    const [selectPlayerDone, setSelectPlayerDone] = useState(false)
    const [perceptionConfigDone, setPerceptionConfigDone] = useState(false)
    const [malfunctionRoleId, setMalfunctionRoleId] = useState<string | null>(
      null,
    )
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

    const malfunctioning = isMalfunctioning(player)

    const roleT = getRoleTranslations('ravenkeeper', language)

    const otherPlayers = state.players.filter((p) => p.id !== player.id)

    // Check if selected target is ambiguous for "role" perception (only when NOT malfunctioning)
    const selectedTargetPlayer = selectedPlayer
      ? (state.players.find((p) => p.id === selectedPlayer) ?? null)
      : null

    const ambiguousPlayers = useMemo(
      () =>
        !malfunctioning && selectedTargetPlayer
          ? getAmbiguousPlayers([selectedTargetPlayer], 'role')
          : [],
      [selectedTargetPlayer, malfunctioning],
    )
    const needsPerceptionConfig = ambiguousPlayers.length > 0

    // Build steps dynamically (perception/malfunction steps may appear after player selection)
    const steps: NightStep[] = useMemo(() => {
      const result: NightStep[] = [
        {
          id: 'select_player',
          icon: 'user',
          label: t.game.stepSelectPlayer,
          status: selectPlayerDone ? 'done' : 'pending',
          audience: 'player_choice' as const,
        },
      ]

      if (selectPlayerDone && malfunctioning) {
        result.push({
          id: 'configure_malfunction',
          icon: 'flask',
          label: t.game.stepConfigureMalfunction,
          status: malfunctionConfigDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      if (selectPlayerDone && needsPerceptionConfig) {
        result.push({
          id: 'configure_perceptions',
          icon: 'eye',
          label: t.game.stepConfigurePerceptions,
          status: perceptionConfigDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      result.push({
        id: 'show_role',
        icon: 'birdHouse',
        label: t.game.stepShowRole,
        status: 'pending',
        audience: 'player_reveal' as const,
      })

      return result
    }, [
      selectPlayerDone,
      malfunctioning,
      malfunctionConfigDone,
      needsPerceptionConfig,
      perceptionConfigDone,
      t,
    ])

    const handleSelectStep = (stepId: string) => {
      if (stepId === 'select_player') {
        setPhase('select_player')
      } else if (stepId === 'configure_malfunction') {
        setPhase('configure_malfunction')
      } else if (stepId === 'configure_perceptions') {
        setPhase('configure_perceptions')
      } else if (stepId === 'show_role') {
        setPhase('show_role')
      }
    }

    const handleMalfunctionComplete = (roleId: string) => {
      setMalfunctionRoleId(roleId)
      setMalfunctionConfigDone(true)
      setPhase('step_list')
    }

    const handleConfirmPlayer = () => {
      if (!selectedPlayer) return
      setSelectPlayerDone(true)
      setPhase('step_list')
    }

    const handlePerceptionComplete = (
      overrides: Record<string, Partial<Perception>>,
    ) => {
      setPerceptionOverrides(overrides)
      setPerceptionConfigDone(true)
      setPhase('step_list')
    }

    // Apply overrides and get perceived role
    const effectiveState = useMemo(
      () => applyPerceptionOverrides(state, perceptionOverrides),
      [state, perceptionOverrides],
    )

    const targetPerception = useMemo(() => {
      if (!selectedTargetPlayer) return null
      const effectiveTarget =
        effectiveState.players.find((p) => p.id === selectedTargetPlayer.id) ??
        selectedTargetPlayer
      const effectiveObserver =
        effectiveState.players.find((p) => p.id === player.id) ?? player
      return perceive(
        effectiveTarget,
        effectiveObserver,
        'role',
        effectiveState,
      )
    }, [effectiveState, selectedTargetPlayer, player])

    // Use malfunction role if set, otherwise use perceived role
    const displayedRoleId = malfunctionRoleId ?? targetPerception?.roleId

    const handleComplete = () => {
      if (!selectedPlayer || !displayedRoleId) return

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.ravenkeeper.history.sawRole',
                params: {
                  player: player.id,
                  target: selectedPlayer,
                  role: displayedRoleId,
                },
              },
            ],
            data: {
              roleId: 'ravenkeeper',
              playerId: player.id,
              action: 'saw_role',
              targetId: selectedPlayer,
              shownRoleId: displayedRoleId,
              ...(malfunctioning
                ? {
                    malfunctioned: true,
                    actualRoleId: targetPerception?.roleId,
                  }
                : {}),
              perceptionOverrides:
                Object.keys(perceptionOverrides).length > 0
                  ? perceptionOverrides
                  : undefined,
            },
          },
        ],
      })
    }

    // Phase: Step List
    if (phase === 'step_list') {
      return (
        <NightStepListLayout
          icon='birdHouse'
          roleName={getRoleName('ravenkeeper', language)}
          playerName={player.name}
          steps={steps}
          onSelectStep={handleSelectStep}
        />
      )
    }

    // Phase: Select Player
    if (phase === 'select_player') {
      return (
        <NightActionLayout
          player={player}
          title={roleT.ravenkeeperInfo}
          description={interpolate(roleT.selectPlayerToSeeRole, { player: player.name })}
          audience="player_choice"
        >
          <div className='mb-6'>
            <PlayerPickerList
              players={otherPlayers}
              selected={selectedPlayer ? [selectedPlayer] : []}
              onSelect={setSelectedPlayer}
              selectionCount={1}
              variant='blue'
            />
          </div>

          <Button
            onClick={handleConfirmPlayer}
            fullWidth
            size='lg'
            disabled={!selectedPlayer}
            variant='night'
          >
            <Icon name='eye' size='md' className='mr-2' />
            {t.common.confirm}
          </Button>
        </NightActionLayout>
      )
    }

    // Phase: Configure Malfunction
    if (phase === 'configure_malfunction') {
      return (
        <MalfunctionConfigStep
          type='role'
          roleIcon='birdHouse'
          roleName={getRoleName('ravenkeeper', language)}
          playerName={player.name}
          state={state}
          onComplete={handleMalfunctionComplete}
        />
      )
    }

    // Phase: Configure Perceptions
    if (phase === 'configure_perceptions') {
      return (
        <PerceptionConfigStep
          ambiguousPlayers={ambiguousPlayers}
          context='role'
          state={state}
          roleIcon='birdHouse'
          roleName={getRoleName('ravenkeeper', language)}
          playerName={player.name}
          onComplete={handlePerceptionComplete}
        />
      )
    }

    // Phase: Show Role
    if (!displayedRoleId) return null

    const shownRole = getRole(displayedRoleId)
    const shownTeamId = shownRole?.team ?? 'townsfolk'
    const shownTeam = getTeam(shownTeamId)

    return (
      <PlayerFacingScreen playerName={player.name}>
        <TeamBackground teamId={shownTeamId}>
          <p
            className={cn(
              'text-center text-sm uppercase tracking-widest font-semibold mb-5',
              shownTeam.isEvil ? 'text-red-300/80' : 'text-parchment-300/80',
            )}
          >
            {roleT.playerRoleIs}
          </p>

          <RoleCard roleId={displayedRoleId} />

          <HandbackCardLink onClick={handleComplete} isEvil={shownTeam.isEvil}>
            {t.common.continue}
          </HandbackCardLink>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  },
}

export default definition
