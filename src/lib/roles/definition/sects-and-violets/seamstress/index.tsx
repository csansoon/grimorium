import { useMemo, useState } from 'react'
import { RoleDefinition, NightActionResult } from '../../../types'
import { Game, isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { ScreenFooter } from '../../../../../components/layouts/ScreenFooter'
import { PlayerFacingScreen } from '../../../../../components/layouts/PlayerFacingScreen'
import {
  PlayerBooleanRevealScreen,
  StorytellerBooleanScreen,
} from '../../../../../components/screens/SectsAndVioletsActionScreens'
import { playersShareAlignment } from '../helpers'
import { getFalseInfoMode, shouldForceFalseInfo } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('seamstress', 'en', en)
registerRoleTranslations('seamstress', 'es', es)

function hasUsedSeamstress(game: Game, playerId: string): boolean {
  return game.history.some(
    (entry) =>
      entry.type === 'night_action' &&
      entry.data.roleId === 'seamstress' &&
      entry.data.playerId === playerId &&
      entry.data.action === 'seamstress_info',
  )
}

const definition: RoleDefinition = {
  id: 'seamstress',
  team: 'townsfolk',
  icon: 'shirt',
  nightOrder: 31,
  chaos: 32,
  shouldWake: (game, player) => isAlive(player) && !hasUsedSeamstress(game, player.id),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('seamstress', language)
    const falseInfoMode = getFalseInfoMode(state, player)
    const malfunctioning = shouldForceFalseInfo(state, player)
    const [phase, setPhase] = useState<'choose_players' | 'configure' | 'show_result'>(
      'choose_players',
    )
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [shownValue, setShownValue] = useState(false)

    const sameAlignment = useMemo(() => {
      if (selectedIds.length !== 2) return false
      return playersShareAlignment(state, player, selectedIds[0], selectedIds[1])
    }, [player, selectedIds, state])

    const playerNames = selectedIds.map(
      (id) => state.players.find((candidate) => candidate.id === id)?.name ?? t.ui.unknownPlayer,
    )

    const finishWith = (resultValue: boolean) => {
      const result: NightActionResult = {
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} learned that ${playerNames[0]} and ${playerNames[1]} are ${resultValue ? 'the same' : 'different'} alignment.`,
              },
            ],
            data: {
              roleId: 'seamstress',
              playerId: player.id,
              action: 'seamstress_info',
              selectedIds,
              sameAlignment: resultValue,
              ...(malfunctioning ? { malfunctioned: true, actualValue: sameAlignment } : {}),
            },
          },
        ],
      }

      onComplete(result)
    }

    if (phase === 'configure') {
      return (
        <StorytellerBooleanScreen
          icon='shirt'
          title={roleT.configureTitle}
          description={roleT.configureDescription.replace('{first}', playerNames[0] ?? '').replace('{second}', playerNames[1] ?? '')}
          trueLabel={roleT.sameLabel}
          falseLabel={roleT.differentLabel}
          falseInfoMode={falseInfoMode}
          onBack={() => setPhase('choose_players')}
          onSelect={(value) => {
            setShownValue(value)
            setPhase('show_result')
          }}
        />
      )
    }

    if (phase === 'show_result') {
      return (
        <PlayerBooleanRevealScreen
          playerName={player.name}
          icon='shirt'
          title={roleT.infoTitle}
          subtitle={roleT.name}
          question={roleT.question.replace('{first}', playerNames[0] ?? '').replace('{second}', playerNames[1] ?? '')}
          value={malfunctioning ? shownValue : sameAlignment}
          trueText={roleT.sameLabel}
          falseText={roleT.differentLabel}
          onComplete={() => finishWith(malfunctioning ? shownValue : sameAlignment)}
        />
      )
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <div className='min-h-app bg-gradient-to-b from-amber-950 via-orange-950/50 to-grimoire-darker flex flex-col'>
          <div className='px-4 py-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-20 h-20 rounded-full flex items-center justify-center border bg-amber-900/30 border-amber-600/40'>
                <Icon name='shirt' size='3xl' className='text-amber-400' />
              </div>
            </div>
            <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-1'>
              {roleT.chooseTitle}
            </h1>
            <p className='text-parchment-400 text-sm max-w-sm mx-auto'>
              {roleT.chooseDescription}
            </p>
          </div>

          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <PlayerPickerList
              players={state.players}
              selected={selectedIds}
              onSelect={(playerId) => {
                setSelectedIds((current) => {
                  if (current.includes(playerId)) {
                    return current.filter((id) => id !== playerId)
                  }
                  if (current.length >= 2) return current
                  return [...current, playerId]
                })
              }}
              selectionCount={2}
              variant='blue'
            />
          </div>

          <ScreenFooter borderColor='border-amber-500/30'>
            <div className='flex w-full gap-3'>
              <Button
                onClick={() =>
                  onComplete({
                    entries: [
                      {
                        type: 'night_skipped',
                        message: [],
                        data: {
                          roleId: 'seamstress',
                          playerId: player.id,
                          action: 'wait',
                        },
                      },
                    ],
                  })
                }
                fullWidth
                size='lg'
                variant='secondary'
              >
                {roleT.waitLabel}
              </Button>
              <Button
                onClick={() => {
                  if (selectedIds.length !== 2) return
                  if (malfunctioning) {
                    setPhase('configure')
                    return
                  }
                  setPhase('show_result')
                }}
                disabled={selectedIds.length !== 2}
                fullWidth
                size='lg'
                variant='primary'
              >
                {roleT.confirmChoiceLabel}
              </Button>
            </div>
          </ScreenFooter>
        </div>
      </PlayerFacingScreen>
    )
  },
}

export default definition
