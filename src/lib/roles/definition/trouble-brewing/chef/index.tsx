import { useState, useMemo } from 'react'
import { RoleDefinition } from '../../../types'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  NightStepListLayout,
  PlayerFacingScreen,
  HandbackCardLink,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import {
  PerceptionConfigStep,
  MalfunctionConfigStep,
  OracleCard,
  NumberReveal,
  TeamBackground,
} from '../../../../../components/items'
import { GameState, PlayerState, isAlive } from '../../../../types'
import {
  perceive,
  getAmbiguousPlayers,
  applyPerceptionOverrides,
} from '../../../../pipeline'
import { isMalfunctioning } from '../../../../effects'
import { Perception } from '../../../../pipeline/types'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('chef', 'en', en)
registerRoleTranslations('chef', 'es', es)

/**
 * Calculate the number of pairs of evil players sitting next to each other.
 * Dead players are skipped when determining neighbors.
 * Uses the perception system so roles like Recluse/Spy are properly handled.
 */
export function countEvilPairs(
  state: GameState,
  observer: PlayerState,
): number {
  const alivePlayers = state.players.filter(isAlive)
  if (alivePlayers.length < 2) return 0

  // Get indices of alive players in the original order
  const aliveIndices = state.players
    .map((p, i) => (isAlive(p) ? i : -1))
    .filter((i) => i !== -1)

  let evilPairs = 0

  // Check each pair of adjacent alive players (in circular order)
  for (let i = 0; i < aliveIndices.length; i++) {
    const currentIdx = aliveIndices[i]
    const nextIdx = aliveIndices[(i + 1) % aliveIndices.length]

    const currentPlayer = state.players[currentIdx]
    const nextPlayer = state.players[nextIdx]

    const currentIsEvil =
      perceive(currentPlayer, observer, 'alignment', state).alignment === 'evil'
    const nextIsEvil =
      perceive(nextPlayer, observer, 'alignment', state).alignment === 'evil'

    if (currentIsEvil && nextIsEvil) {
      evilPairs++
    }
  }

  return evilPairs
}

type Phase =
  | 'step_list'
  | 'configure_perceptions'
  | 'configure_malfunction'
  | 'show_result'

const definition: RoleDefinition = {
  id: 'chef',
  team: 'townsfolk',
  icon: 'chefHat',
  nightOrder: 13,
  chaos: 20,
  shouldWake: (game, player) =>
    isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  nightSteps: [
    {
      id: 'configure_malfunction',
      icon: 'flask',
      getLabel: (t) => t.game.stepConfigureMalfunction,
      condition: (_game, player) => isMalfunctioning(player),
      audience: 'narrator',
    },
    {
      id: 'configure_perceptions',
      icon: 'hatGlasses',
      getLabel: (t) => t.game.stepConfigurePerceptions,
      condition: (_game, player, state) =>
        !isMalfunctioning(player) &&
        getAmbiguousPlayers(state.players.filter(isAlive), 'alignment').length >
          0,
      audience: 'narrator',
    },
    {
      id: 'show_result',
      icon: 'chefHat',
      getLabel: (t) => t.game.stepShowResult,
      audience: 'player_reveal',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')
    const [perceptionOverrides, setPerceptionOverrides] = useState<
      Record<string, Partial<Perception>>
    >({})
    const [malfunctionValue, setMalfunctionValue] = useState<number | null>(
      null,
    )

    const malfunctioning = isMalfunctioning(player)

    // Check if perception config is needed (only when NOT malfunctioning)
    const ambiguousPlayers = useMemo(
      () =>
        malfunctioning
          ? []
          : getAmbiguousPlayers(state.players.filter(isAlive), 'alignment'),
      [state, malfunctioning],
    )
    const needsPerceptionConfig = ambiguousPlayers.length > 0

    // Track which steps are done
    const [perceptionConfigDone, setPerceptionConfigDone] = useState(false)
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

    // Role-specific translations via registry
    const roleT = getRoleTranslations('chef', language)

    // Build steps for the step list
    const steps: NightStep[] = useMemo(() => {
      const result: NightStep[] = []

      if (malfunctioning) {
        result.push({
          id: 'configure_malfunction',
          icon: 'flask',
          label: t.game.stepConfigureMalfunction,
          status: malfunctionConfigDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      if (needsPerceptionConfig) {
        result.push({
          id: 'configure_perceptions',
          icon: 'hatGlasses',
          label: t.game.stepConfigurePerceptions,
          status: perceptionConfigDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      result.push({
        id: 'show_result',
        icon: 'chefHat',
        label: t.game.stepShowResult,
        status: 'pending',
        audience: 'player_reveal' as const,
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
      } else if (stepId === 'show_result') {
        setPhase('show_result')
      }
    }

    const handlePerceptionComplete = (
      overrides: Record<string, Partial<Perception>>,
    ) => {
      setPerceptionOverrides(overrides)
      setPerceptionConfigDone(true)
      setPhase('step_list')
    }

    const handleMalfunctionComplete = (value: number) => {
      setMalfunctionValue(value)
      setMalfunctionConfigDone(true)
      setPhase('step_list')
    }

    // Apply perception overrides and calculate evil pairs
    const effectiveState = useMemo(
      () => applyPerceptionOverrides(state, perceptionOverrides),
      [state, perceptionOverrides],
    )

    const calculatedEvilPairs = useMemo(() => {
      const effectiveObserver =
        effectiveState.players.find((p) => p.id === player.id) ?? player
      return countEvilPairs(effectiveState, effectiveObserver)
    }, [effectiveState, player])

    // Use malfunction value if set, otherwise use calculated value
    const displayedEvilPairs = malfunctionValue ?? calculatedEvilPairs

    const handleComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.chef.history.sawEvilPairs',
                params: {
                  player: player.id,
                  count: displayedEvilPairs.toString(),
                },
              },
            ],
            data: {
              roleId: 'chef',
              playerId: player.id,
              action: 'count_evil_pairs',
              evilPairs: displayedEvilPairs,
              ...(malfunctioning
                ? {
                    malfunctioned: true,
                    actualEvilPairs: calculatedEvilPairs,
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
          icon='chefHat'
          roleName={getRoleName('chef', language)}
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
          type='number'
          roleIcon='chefHat'
          roleName={getRoleName('chef', language)}
          playerName={player.name}
          numberRange={{
            min: 0,
            max: Math.floor(state.players.filter(isAlive).length / 2),
          }}
          onComplete={handleMalfunctionComplete}
        />
      )
    }

    // Phase: Configure Perceptions
    if (phase === 'configure_perceptions') {
      return (
        <PerceptionConfigStep
          ambiguousPlayers={ambiguousPlayers}
          context='alignment'
          state={state}
          roleIcon='chefHat'
          roleName={getRoleName('chef', language)}
          playerName={player.name}
          onComplete={handlePerceptionComplete}
        />
      )
    }

    // Phase: Show Result — dynamic theme based on result
    const resultTeam = displayedEvilPairs > 0 ? 'minion' : 'townsfolk'

    return (
      <PlayerFacingScreen playerName={player.name}>
        <TeamBackground teamId={resultTeam}>
          <OracleCard
            icon='chefHat'
            teamId={resultTeam}
            title={roleT.info}
            subtitle={getRoleName('chef', language)}
          >
            <NumberReveal
              value={displayedEvilPairs}
              label={roleT.evilPairsCount}
              teamId={resultTeam}
            />
          </OracleCard>
          <HandbackCardLink
            onClick={handleComplete}
            isEvil={resultTeam !== 'townsfolk'}
          >
            {t.common.iUnderstandMyRole}
          </HandbackCardLink>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  },
}

export default definition
