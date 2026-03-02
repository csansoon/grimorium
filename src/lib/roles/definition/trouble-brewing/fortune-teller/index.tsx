import { useState, useMemo } from 'react'
import {
  RoleDefinition,
  NightActionResult,
  SetupActionProps,
} from '../../../types'
import { getRole } from '../../../index'
import { isAlive } from '../../../../types'
import {
  useI18n,
  interpolate,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  NarratorSetupLayout,
  NightStepListLayout,
  PlayerFacingScreen,
  HandbackCardLink,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import {
  StepSection,
  MalfunctionConfigStep,
  PerceptionConfigStep,
  OracleCard,
  VisionReveal,
  TeamBackground,
} from '../../../../../components/items'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import {
  perceive,
  getAmbiguousPlayers,
  applyPerceptionOverrides,
} from '../../../../pipeline'
import { isMalfunctioning } from '../../../../effects'
import { Perception } from '../../../../pipeline/types'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('fortune_teller', 'en', en)
registerRoleTranslations('fortune_teller', 'es', es)

type Phase =
  | 'step_list'
  | 'select_players'
  | 'configure_perceptions'
  | 'configure_malfunction'
  | 'show_result'

function FortuneTellerSetupAction({
  player,
  state,
  onComplete,
}: SetupActionProps) {
  const { t, language } = useI18n()
  const roleT = getRoleTranslations('fortune_teller', language)
  const [selectedRedHerring, setSelectedRedHerring] = useState<string | null>(
    null,
  )

  // Get good players for Red Herring selection (exclude the Fortune Teller)
  const goodPlayers = state.players.filter((p) => {
    const role = getRole(p.roleId)
    return role?.team === 'townsfolk' || role?.team === 'outsider'
  })

  const handleSelectRandom = () => {
    if (goodPlayers.length === 0) return
    const randomIndex = Math.floor(Math.random() * goodPlayers.length)
    setSelectedRedHerring(goodPlayers[randomIndex].id)
  }

  const handleConfirm = () => {
    if (!selectedRedHerring) return
    onComplete({
      addEffects: {
        [selectedRedHerring]: [
          {
            type: 'red_herring',
            data: { fortuneTellerId: player.id },
            expiresAt: 'never',
          },
        ],
      },
    })
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <div className='w-10 h-10 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center'>
            <Icon name='eye' size='md' className='text-amber-400' />
          </div>
          <div>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {roleT.redHerringSetupTitle}
            </h1>
            <p className='text-xs text-parchment-500'>{player.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto'>
        <div className='rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 mb-4'>
          <p className='text-sm text-parchment-300'>{roleT.redHerringInfo}</p>
        </div>

        <div className='flex justify-center mb-4'>
          <Button variant='secondary' onClick={handleSelectRandom}>
            <Icon name='shuffle' size='sm' className='mr-2' />
            {roleT.selectRandomRedHerring}
          </Button>
        </div>

        <h3 className='text-sm font-medium text-parchment-400 uppercase tracking-wider mb-3'>
          {roleT.selectGoodPlayerAsRedHerring}
        </h3>

        <div className='mb-6'>
          <PlayerPickerList
            players={goodPlayers}
            selected={selectedRedHerring ? [selectedRedHerring] : []}
            onSelect={setSelectedRedHerring}
            selectionCount={1}
            variant='blue'
          />
        </div>
      </div>

      {/* Footer */}
      <div className='sticky bottom-0 bg-grimoire-dark/95 backdrop-blur-sm border-t border-mystic-gold/20 px-4 py-3'>
        <div className='max-w-lg mx-auto'>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRedHerring}
            fullWidth
            size='lg'
            variant='gold'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.confirm}
          </Button>
        </div>
      </div>
    </div>
  )
}

const definition: RoleDefinition = {
  id: 'fortune_teller',
  team: 'townsfolk',
  icon: 'eye',
  nightOrder: 15,
  chaos: 40,
  shouldWake: (_game, player) => isAlive(player),

  nightSteps: [
    {
      id: 'select_players',
      icon: 'users',
      getLabel: (t) => t.game.stepSelectPlayers,
      audience: 'player_choice',
    },
    {
      id: 'configure_malfunction',
      icon: 'flask',
      getLabel: (t) => t.game.stepConfigureMalfunction,
      condition: (_game, player) => isMalfunctioning(player),
      audience: 'narrator',
    },
    {
      id: 'show_result',
      icon: 'eye',
      getLabel: (t) => t.game.stepShowResult,
      audience: 'player_reveal',
    },
  ],

  SetupAction: FortuneTellerSetupAction,

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()

    const roleT = getRoleTranslations('fortune_teller', language)

    const malfunctioning = isMalfunctioning(player)

    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
    const [selectPlayersDone, setSelectPlayersDone] = useState(false)
    const [malfunctionValue, setMalfunctionValue] = useState<boolean | null>(
      null,
    )
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)
    const [perceptionOverrides, setPerceptionOverrides] = useState<
      Record<string, Partial<Perception>>
    >({})
    const [perceptionConfigDone, setPerceptionConfigDone] = useState(false)

    // Get all players for the nightly check (Fortune Teller can select themselves)
    const selectablePlayers = state.players

    // Check if selected players include ambiguous players for "role" perception (only when NOT malfunctioning)
    const selectedPlayerObjects = useMemo(
      () => state.players.filter((p) => selectedPlayers.includes(p.id)),
      [selectedPlayers, state.players],
    )
    const ambiguousPlayers = useMemo(
      () =>
        !malfunctioning && selectPlayersDone
          ? getAmbiguousPlayers(selectedPlayerObjects, 'team')
          : [],
      [selectedPlayerObjects, malfunctioning, selectPlayersDone],
    )
    const needsPerceptionConfig = ambiguousPlayers.length > 0

    const getPlayerName = (playerId: string) => {
      return state.players.find((p) => p.id === playerId)?.name ?? t.ui.unknown
    }

    // Build steps: Select players, Configure Perceptions (cond.), Configure Malfunction (cond.), Show Result
    const steps: NightStep[] = useMemo(() => {
      const result: NightStep[] = []

      result.push({
        id: 'select_players',
        icon: 'users',
        label: t.game.stepSelectPlayers,
        status: selectPlayersDone ? 'done' : 'pending',
        audience: 'player_choice' as const,
      })

      if (selectPlayersDone && needsPerceptionConfig) {
        result.push({
          id: 'configure_perceptions',
          icon: 'hatGlasses',
          label: t.game.stepConfigurePerceptions,
          status: perceptionConfigDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      if (malfunctioning) {
        result.push({
          id: 'configure_malfunction',
          icon: 'flask',
          label: t.game.stepConfigureMalfunction,
          status: malfunctionConfigDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      result.push({
        id: 'show_result',
        icon: 'eye',
        label: t.game.stepShowResult,
        status: 'pending',
        audience: 'player_reveal' as const,
      })

      return result
    }, [selectPlayersDone, needsPerceptionConfig, perceptionConfigDone, malfunctioning, malfunctionConfigDone, t])

    const handleSelectStep = (stepId: string) => {
      if (stepId === 'select_players') {
        setPhase('select_players')
      } else if (stepId === 'configure_perceptions') {
        setPhase('configure_perceptions')
      } else if (stepId === 'configure_malfunction') {
        setPhase('configure_malfunction')
      } else if (stepId === 'show_result') {
        setPhase('show_result')
      }
    }

    const handleMalfunctionComplete = (value: boolean) => {
      setMalfunctionValue(value)
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

    const handlePlayerToggle = (playerId: string) => {
      setSelectedPlayers((prev) => {
        if (prev.includes(playerId)) {
          return prev.filter((id) => id !== playerId)
        } else if (prev.length < 2) {
          return [...prev, playerId]
        }
        return prev
      })
    }

    const handleSelectPlayersDone = () => {
      if (selectedPlayers.length !== 2) return
      setSelectPlayersDone(true)
      setPhase('step_list')
    }

    // Apply perception overrides for result calculation
    const effectiveState = useMemo(
      () => applyPerceptionOverrides(state, perceptionOverrides),
      [state, perceptionOverrides],
    )

    const handleComplete = () => {
      if (selectedPlayers.length !== 2) return

      const player1 = effectiveState.players.find(
        (p) => p.id === selectedPlayers[0],
      )
      const player2 = effectiveState.players.find(
        (p) => p.id === selectedPlayers[1],
      )
      if (!player1 || !player2) return

      const effectiveObserver =
        effectiveState.players.find((p) => p.id === player.id) ?? player

      // Check if either selected player registers as a Demon
      const registersDemon = (p: typeof player1) => {
        if (!p) return false
        const perception = perceive(p, effectiveObserver, 'team', effectiveState)
        return perception.team === 'demon'
      }

      const calculatedSawDemon =
        registersDemon(player1) || registersDemon(player2)
      // Use malfunction override if set, otherwise use calculated result
      const sawDemon =
        malfunctionValue !== null ? malfunctionValue : calculatedSawDemon

      const entries: NightActionResult['entries'] = []

      // Log the check result
      entries.push({
        type: 'night_action',
        message: [
          {
            type: 'i18n',
            key: sawDemon
              ? 'roles.fortune_teller.history.sawDemon'
              : 'roles.fortune_teller.history.sawNoDemon',
            params: {
              player: player.id,
              player1: player1.id,
              player2: player2.id,
            },
          },
        ],
        data: {
          roleId: 'fortune_teller',
          playerId: player.id,
          action: 'check',
          checkedPlayers: selectedPlayers,
          result: sawDemon ? 'yes' : 'no',
          ...(malfunctioning
            ? {
              malfunctioned: true,
              actualResult: calculatedSawDemon ? 'yes' : 'no',
            }
            : {}),
          perceptionOverrides:
            Object.keys(perceptionOverrides).length > 0
              ? perceptionOverrides
              : undefined,
        },
      })

      onComplete({ entries })
    }

    // Phase: Step List
    if (phase === 'step_list') {
      return (
        <NightStepListLayout
          icon='eye'
          roleName={getRoleName('fortune_teller', language)}
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
          type='boolean'
          roleIcon='eye'
          roleName={getRoleName('fortune_teller', language)}
          playerName={player.name}
          trueLabel={roleT.yesOneIsDemon}
          falseLabel={roleT.noNeitherIsDemon}
          onComplete={handleMalfunctionComplete}
        />
      )
    }

    // Phase: Configure Perceptions
    if (phase === 'configure_perceptions') {
      return (
        <PerceptionConfigStep
          ambiguousPlayers={ambiguousPlayers}
          context='team'
          state={state}
          roleIcon='eye'
          roleName={getRoleName('fortune_teller', language)}
          playerName={player.name}
          onComplete={handlePerceptionComplete}
        />
      )
    }

    // Phase: Select players - narrator picks 2 players to check
    if (phase === 'select_players') {
      return (
        <NarratorSetupLayout
          icon='eye'
          roleName={getRoleName('fortune_teller', language)}
          audience='player_choice'
          playerName={getPlayerName(player.id)}
          onShowToPlayer={handleSelectPlayersDone}
          showToPlayerDisabled={selectedPlayers.length !== 2}
          showToPlayerLabel={t.common.confirm}
        >
          <StepSection
            step={1}
            label={interpolate(roleT.selectTwoPlayersToCheck, { player: getPlayerName(player.id) })}
            count={{ current: selectedPlayers.length, max: 2 }}
          >
            <PlayerPickerList
              players={selectablePlayers}
              selected={selectedPlayers}
              onSelect={handlePlayerToggle}
              selectionCount={2}
              variant='blue'
            />
          </StepSection>
        </NarratorSetupLayout>
      )
    }

    // Phase: Show Result - player-facing screen
    const player1 = effectiveState.players.find(
      (p) => p.id === selectedPlayers[0],
    )
    const player2 = effectiveState.players.find(
      (p) => p.id === selectedPlayers[1],
    )
    const effectiveObserver =
      effectiveState.players.find((p) => p.id === player.id) ?? player

    // Calculate result for display
    const registersDemon = (p: typeof player1) => {
      if (!p) return false
      const perception = perceive(p, effectiveObserver, 'team', effectiveState)
      return perception.team === 'demon'
    }

    const displaySawDemon =
      malfunctionValue !== null
        ? malfunctionValue
        : registersDemon(player1) || registersDemon(player2)

    // Dynamic theme: demon background when detected, townsfolk when safe
    const resultTeam = displaySawDemon ? 'demon' : 'townsfolk'

    return (
      <PlayerFacingScreen playerName={player.name}>
        <TeamBackground teamId={resultTeam}>
          <OracleCard
            icon='eye'
            teamId={resultTeam}
            title={roleT.fortuneTellerInfo}
            subtitle={getRoleName('fortune_teller', language)}
          >
            <VisionReveal
              players={[player1?.name ?? '???', player2?.name ?? '???']}
              verdict={
                displaySawDemon
                  ? roleT.fortuneTellerDemonDetected
                  : roleT.fortuneTellerNoDemon
              }
              verdictIcon={displaySawDemon ? 'skull' : 'shield'}
              teamId={resultTeam}
            />
          </OracleCard>
          <HandbackCardLink onClick={handleComplete} isEvil={displaySawDemon}>
            {t.common.continue}
          </HandbackCardLink>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  },
}

export default definition
