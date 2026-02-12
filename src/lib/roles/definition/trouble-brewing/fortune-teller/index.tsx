import { useState, useMemo } from 'react'
import { RoleDefinition, NightActionResult } from '../../../types'
import { getRole } from '../../../index'
import { isAlive } from '../../../../types'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  NarratorSetupLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import {
  StepSection,
  MalfunctionConfigStep,
  OracleCard,
  VisionReveal,
  TeamBackground,
  CardLink,
} from '../../../../../components/items'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { perceive } from '../../../../pipeline'
import { isMalfunctioning } from '../../../../effects'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('fortune_teller', 'en', en)
registerRoleTranslations('fortune_teller', 'es', es)

type Phase =
  | 'step_list'
  | 'red_herring_setup'
  | 'select_players'
  | 'configure_malfunction'
  | 'show_result'

const definition: RoleDefinition = {
  id: 'fortune_teller',
  team: 'townsfolk',
  icon: 'eye',
  nightOrder: 15,
  chaos: 40,
  shouldWake: (_game, player) => isAlive(player),

  nightSteps: [
    {
      id: 'red_herring_setup',
      icon: 'fish',
      getLabel: (t) => t.game.stepAssignRedHerring,
      condition: (_game, player, state) => {
        const isFirstNight = state.round === 1
        const hasRedHerring = state.players.some((p) =>
          p.effects.some(
            (e) =>
              e.type === 'red_herring' && e.data?.fortuneTellerId === player.id,
          ),
        )
        return isFirstNight && !hasRedHerring && !isMalfunctioning(player)
      },
      audience: 'narrator',
    },
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

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()

    const roleT = getRoleTranslations('fortune_teller', language)

    // Check if this Fortune Teller already has a Red Herring assigned
    const hasRedHerring = state.players.some((p) =>
      p.effects.some(
        (e) =>
          e.type === 'red_herring' && e.data?.fortuneTellerId === player.id,
      ),
    )

    const isFirstNight = state.round === 1
    const malfunctioning = isMalfunctioning(player)
    const needsRedHerringSetup =
      isFirstNight && !hasRedHerring && !malfunctioning

    const [phase, setPhase] = useState<Phase>('step_list')
    const [selectedRedHerring, setSelectedRedHerring] = useState<string | null>(
      null,
    )
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
    const [redHerringDone, setRedHerringDone] = useState(false)
    const [selectPlayersDone, setSelectPlayersDone] = useState(false)
    const [malfunctionValue, setMalfunctionValue] = useState<boolean | null>(
      null,
    )
    const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

    // Get good players for Red Herring selection
    const goodPlayers = state.players.filter((p) => {
      if (p.id === player.id) return false
      const role = getRole(p.roleId)
      return role?.team === 'townsfolk' || role?.team === 'outsider'
    })

    // Get all other players for the nightly check
    const otherPlayers = state.players.filter((p) => p.id !== player.id)

    const getPlayerName = (playerId: string) => {
      return state.players.find((p) => p.id === playerId)?.name ?? t.ui.unknown
    }

    // Build steps: Assign Red Herring (cond.), Select players, Configure Malfunction (cond.), Show Result
    const steps: NightStep[] = useMemo(() => {
      const result: NightStep[] = []

      if (needsRedHerringSetup) {
        result.push({
          id: 'red_herring_setup',
          icon: 'fish',
          label: t.game.stepAssignRedHerring,
          status: redHerringDone ? 'done' : 'pending',
          audience: 'narrator' as const,
        })
      }

      result.push({
        id: 'select_players',
        icon: 'users',
        label: t.game.stepSelectPlayers,
        status: selectPlayersDone ? 'done' : 'pending',
        audience: 'player_choice' as const,
      })

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
    }, [
      needsRedHerringSetup,
      redHerringDone,
      selectPlayersDone,
      malfunctioning,
      malfunctionConfigDone,
      t,
    ])

    const handleSelectStep = (stepId: string) => {
      if (stepId === 'red_herring_setup') {
        setPhase('red_herring_setup')
      } else if (stepId === 'select_players') {
        setPhase('select_players')
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

    const handleSelectRandomRedHerring = () => {
      if (goodPlayers.length === 0) return
      const randomIndex = Math.floor(Math.random() * goodPlayers.length)
      setSelectedRedHerring(goodPlayers[randomIndex].id)
    }

    const handleConfirmRedHerring = () => {
      if (!selectedRedHerring) return
      setRedHerringDone(true)
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

    const handleComplete = () => {
      if (selectedPlayers.length !== 2) return

      const player1 = state.players.find((p) => p.id === selectedPlayers[0])
      const player2 = state.players.find((p) => p.id === selectedPlayers[1])
      if (!player1 || !player2) return

      // Check if either selected player registers as a Demon
      const registersDemon = (p: typeof player1) => {
        const perception = perceive(p, player, 'role', state)
        if (perception.team === 'demon') return true
        if (selectedRedHerring === p.id) return true
        return false
      }

      const calculatedSawDemon =
        registersDemon(player1) || registersDemon(player2)
      // Use malfunction override if set, otherwise use calculated result
      const sawDemon =
        malfunctionValue !== null ? malfunctionValue : calculatedSawDemon

      const entries: NightActionResult['entries'] = []

      // If we just assigned a Red Herring, log it first
      if (needsRedHerringSetup && selectedRedHerring) {
        const redHerringPlayer = state.players.find(
          (p) => p.id === selectedRedHerring,
        )
        if (redHerringPlayer) {
          entries.push({
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.fortune_teller.history.redHerringAssigned',
                params: {
                  redHerring: redHerringPlayer.id,
                  player: player.id,
                },
              },
            ],
            data: {
              roleId: 'fortune_teller',
              playerId: player.id,
              action: 'assign_red_herring',
              redHerringId: selectedRedHerring,
            },
          })
        }
      }

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
        },
      })

      onComplete({
        entries,
        addEffects:
          needsRedHerringSetup && selectedRedHerring
            ? {
                [selectedRedHerring]: [
                  {
                    type: 'red_herring',
                    data: { fortuneTellerId: player.id },
                    expiresAt: 'never',
                  },
                ],
              }
            : undefined,
      })
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

    // Phase: Red Herring Setup
    if (phase === 'red_herring_setup') {
      return (
        <NarratorSetupLayout
          icon='eye'
          roleName={getRoleName('fortune_teller', language)}
          audience='narrator'
          playerName={getPlayerName(player.id)}
          onShowToPlayer={handleConfirmRedHerring}
          showToPlayerDisabled={!selectedRedHerring}
          showToPlayerLabel={t.common.confirm}
        >
          <div className='text-center mb-4'>
            <h3 className='text-lg font-semibold text-amber-200'>
              {roleT.selectRedHerring}
            </h3>
            <p className='text-sm text-stone-400 mt-1'>
              {roleT.redHerringInfo}
            </p>
          </div>

          <div className='flex justify-center mb-4'>
            <Button variant='secondary' onClick={handleSelectRandomRedHerring}>
              <Icon name='shuffle' size='sm' className='mr-2' />
              {roleT.selectRandomRedHerring}
            </Button>
          </div>

          <StepSection step={1} label={roleT.selectGoodPlayerAsRedHerring}>
            <PlayerPickerList
              players={goodPlayers}
              selected={selectedRedHerring ? [selectedRedHerring] : []}
              onSelect={setSelectedRedHerring}
              selectionCount={1}
              variant='blue'
            />
          </StepSection>
        </NarratorSetupLayout>
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
            label={roleT.selectTwoPlayersToCheck}
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

    // Phase: Show Result - player-facing screen
    const player1 = state.players.find((p) => p.id === selectedPlayers[0])
    const player2 = state.players.find((p) => p.id === selectedPlayers[1])

    // Calculate result for display
    const registersDemon = (p: typeof player1) => {
      if (!p) return false
      const perception = perceive(p, player, 'role', state)
      if (perception.team === 'demon') return true
      if (selectedRedHerring === p.id) return true
      return false
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
          <CardLink onClick={handleComplete} isEvil={displaySawDemon}>
            {t.common.iUnderstandMyRole}
          </CardLink>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  },
}

export default definition
