import { useState, useMemo } from 'react'
import { RoleDefinition } from '../../../types'
import { getRole } from '../../../index'
import { getTeam } from '../../../../teams'
import { isAlive } from '../../../../types'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { RoleCard } from '../../../../../components/items/RoleCard'
import { PerceptionConfigStep } from '../../../../../components/items'
import {
  TeamBackground,
  CardLink,
} from '../../../../../components/items/TeamBackground'
import {
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
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

registerRoleTranslations('undertaker', 'en', en)
registerRoleTranslations('undertaker', 'es', es)

// Helper to find execution from the previous day
function findExecutedPlayerId(game: {
  history: Array<{ type: string; data: Record<string, unknown> }>
}): string | null {
  let lastDayStartIndex = -1

  for (let i = game.history.length - 1; i >= 0; i--) {
    const entry = game.history[i]
    if (entry.type === 'day_started') {
      lastDayStartIndex = i
      break
    }
  }

  if (lastDayStartIndex !== -1) {
    for (let i = lastDayStartIndex; i < game.history.length; i++) {
      const entry = game.history[i]
      if (entry.type === 'execution') {
        return entry.data.playerId as string
      }
    }
  }

  return null
}

type Phase =
  | 'step_list'
  | 'configure_perceptions'
  | 'configure_malfunction'
  | 'show_role'

const definition: RoleDefinition = {
  id: 'undertaker',
  team: 'townsfolk',
  icon: 'shovel',
  nightOrder: 40, // Wakes late, after deaths are resolved
  chaos: 20,

  // Only wake if alive, not first night, AND there was an execution during the day
  shouldWake: (game, player) => {
    if (!isAlive(player)) return false
    const round = game.history.at(-1)?.stateAfter.round ?? 0
    if (round <= 1) return false // Skip first night
    return findExecutedPlayerId(game) !== null
  },

  nightSteps: [
    {
      id: 'configure_malfunction',
      icon: 'flask',
      getLabel: (t) => t.game.stepConfigureMalfunction,
      condition: (_game, player) => isMalfunctioning(player),
    },
    {
      id: 'configure_perceptions',
      icon: 'hatGlasses',
      getLabel: (t) => t.game.stepConfigurePerceptions,
      condition: (game, player, state) => {
        if (isMalfunctioning(player)) return false
        const executedPlayerId = findExecutedPlayerId(game)
        if (!executedPlayerId) return false
        const executedPlayer = state.players.find(
          (p) => p.id === executedPlayerId,
        )
        if (!executedPlayer) return false
        return getAmbiguousPlayers([executedPlayer], 'role').length > 0
      },
    },
    {
      id: 'show_role',
      icon: 'shovel',
      getLabel: (t) => t.game.stepShowRole,
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ game, state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')
    const [perceptionOverrides, setPerceptionOverrides] = useState<
      Record<string, Partial<Perception>>
    >({})
    const [malfunctionRoleId, setMalfunctionRoleId] = useState<string | null>(
      null,
    )
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

    const malfunctioning = isMalfunctioning(player)

    const roleT = getRoleTranslations('undertaker', language)

    // Find the executed player
    const executedPlayerId = findExecutedPlayerId(game)
    const executedPlayer = executedPlayerId
      ? state.players.find((p) => p.id === executedPlayerId)
      : null

    // Check if perception config is needed (only when NOT malfunctioning)
    const ambiguousPlayers = useMemo(
      () =>
        !malfunctioning && executedPlayer
          ? getAmbiguousPlayers([executedPlayer], 'role')
          : [],
      [executedPlayer, malfunctioning],
    )
    const needsPerceptionConfig = ambiguousPlayers.length > 0

    const [perceptionConfigDone, setPerceptionConfigDone] = useState(false)

    // Build steps
    const steps: NightStep[] = useMemo(() => {
      const result: NightStep[] = []

      if (malfunctioning) {
        result.push({
          id: 'configure_malfunction',
          icon: 'flask',
          label: t.game.stepConfigureMalfunction,
          status: malfunctionConfigDone ? 'done' : 'pending',
        })
      }

      if (needsPerceptionConfig) {
        result.push({
          id: 'configure_perceptions',
          icon: 'hatGlasses',
          label: t.game.stepConfigurePerceptions,
          status: perceptionConfigDone ? 'done' : 'pending',
        })
      }

      result.push({
        id: 'show_role',
        icon: 'shovel',
        label: t.game.stepShowRole,
        status: 'pending',
      })

      return result
    }, [
      malfunctioning,
      needsPerceptionConfig,
      perceptionConfigDone,
      malfunctionConfigDone,
      t,
    ])

    const handleSelectStep = (stepId: string) => {
      if (stepId === 'configure_malfunction') {
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

    const handlePerceptionComplete = (
      overrides: Record<string, Partial<Perception>>,
    ) => {
      setPerceptionOverrides(overrides)
      setPerceptionConfigDone(true)
      setPhase('step_list')
    }

    // Apply perception overrides
    const effectiveState = useMemo(
      () => applyPerceptionOverrides(state, perceptionOverrides),
      [state, perceptionOverrides],
    )

    // Get perceived role of executed player
    const executedPerception = useMemo(() => {
      if (!executedPlayer) return null
      const effectiveExecuted =
        effectiveState.players.find((p) => p.id === executedPlayer.id) ??
        executedPlayer
      const effectiveObserver =
        effectiveState.players.find((p) => p.id === player.id) ?? player
      return perceive(
        effectiveExecuted,
        effectiveObserver,
        'role',
        effectiveState,
      )
    }, [effectiveState, executedPlayer, player])

    // Use malfunction role if set, otherwise use perceived role
    const displayedRoleId = malfunctionRoleId ?? executedPerception?.roleId

    const handleComplete = () => {
      if (executedPlayer && displayedRoleId) {
        onComplete({
          entries: [
            {
              type: 'night_action',
              message: [
                {
                  type: 'i18n',
                  key: 'roles.undertaker.history.sawExecutedRole',
                  params: {
                    player: player.id,
                    role: displayedRoleId,
                  },
                },
              ],
              data: {
                roleId: 'undertaker',
                playerId: player.id,
                action: 'saw_executed',
                executedPlayerId: executedPlayer.id,
                executedRoleId: displayedRoleId,
                ...(malfunctioning
                  ? {
                      malfunctioned: true,
                      actualRoleId: executedPerception?.roleId,
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
    }

    // Phase: Step List
    if (phase === 'step_list') {
      return (
        <NightStepListLayout
          icon='shovel'
          roleName={getRoleName('undertaker', language)}
          playerName={player.name}
          steps={steps}
          onSelectStep={handleSelectStep}
        />
      )
    }

    // Phase: Configure Malfunction
    if (phase === 'configure_malfunction') {
      return (
        <MalfunctionConfigStep
          type='role'
          roleIcon='shovel'
          roleName={getRoleName('undertaker', language)}
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
          roleIcon='shovel'
          roleName={getRoleName('undertaker', language)}
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
      <PlayerFacingScreen>
        <TeamBackground teamId={shownTeamId}>
          <p
            className={cn(
              'text-center text-sm uppercase tracking-widest font-semibold mb-5',
              shownTeam.isEvil ? 'text-red-300/80' : 'text-parchment-300/80',
            )}
          >
            {roleT.executedPlayerRole}
          </p>

          <RoleCard roleId={displayedRoleId} />

          <CardLink onClick={handleComplete} isEvil={shownTeam.isEvil}>
            {t.common.continue}
          </CardLink>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  },
}

export default definition
