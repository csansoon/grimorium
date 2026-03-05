import { useState } from 'react'
import { EffectDefinition } from '../../types'
import { DayActionDefinition, DayActionProps } from '../../../pipeline/types'
import { hasEffect, isAlive } from '../../../types'
import { useI18n } from '../../../i18n'
import { Button, Icon, BackButton } from '../../../../components/atoms'
import { ScreenFooter } from '../../../../components/layouts/ScreenFooter'
import { PlayerFacingScreen } from '../../../../components/layouts/PlayerFacingScreen'
import { OracleCard, TeamBackground } from '../../../../components/items'
import { getFalseInfoMode } from '../../../roles/runtime-helpers'

function SavantAdviceAction({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  const { t } = useI18n()
  const player = state.players.find((candidate) => candidate.id === playerId)
  const [firstStatement, setFirstStatement] = useState('')
  const [secondStatement, setSecondStatement] = useState('')
  const [phase, setPhase] = useState<'compose' | 'reveal'>('compose')

  if (!player) return null
  const falseInfoMode = getFalseInfoMode(state, player)

  if (phase === 'reveal') {
    return (
      <PlayerFacingScreen playerName={player.name}>
        <TeamBackground teamId='townsfolk'>
          <div className='min-h-app flex flex-col'>
            <div className='flex-1 px-6 py-8 flex items-center justify-center'>
              <div className='w-full max-w-sm'>
                <OracleCard
                  icon='scrollText'
                  teamId='townsfolk'
                  title='Savant'
                  subtitle={player.name}
                >
                  <div className='space-y-4 py-3'>
                    <p className='text-center text-parchment-300 text-sm'>
                      Two statements. One is true and one is false.
                    </p>
                    {[firstStatement, secondStatement].map((statement, index) => (
                      <div
                        key={index}
                        className='rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-parchment-100 text-sm leading-relaxed'
                      >
                        {statement}
                      </div>
                    ))}
                  </div>
                </OracleCard>
              </div>
            </div>

            <ScreenFooter borderColor='border-indigo-500/30'>
              <Button
                onClick={() =>
                  onComplete({
                    entries: [
                      {
                        type: 'night_action',
                        message: [
                          {
                            type: 'text',
                            content: `${player.name} received Savant information: "${firstStatement}" / "${secondStatement}".`,
                          },
                        ],
                        data: {
                          roleId: 'savant',
                          playerId,
                          action: 'savant_info',
                          statements: [firstStatement, secondStatement],
                        },
                      },
                    ],
                  })
                }
                fullWidth
                size='lg'
                variant='primary'
              >
                {t.common.continue}
              </Button>
            </ScreenFooter>
          </div>
        </TeamBackground>
      </PlayerFacingScreen>
    )
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          <div className='flex items-center mb-4'>
            <BackButton onClick={onBack} />
            <span className='text-parchment-500 text-xs ml-1'>
              {t.common.back}
            </span>
          </div>

          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name='scrollText' size='3xl' className='text-indigo-300' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              Savant
            </h1>
            <p className='text-parchment-400 text-sm'>
              Record two statements to show the Savant. One should be true and one false.
            </p>
          </div>
        </div>
      </div>

      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4'>
        {falseInfoMode && (
          <div className='rounded-lg bg-amber-900/40 border border-amber-500/40 px-3 py-2 flex items-start gap-2'>
            <Icon name='flask' size='sm' className='text-amber-400 flex-shrink-0 mt-0.5' />
            <span className='text-amber-300 text-xs'>
              {falseInfoMode === 'vortox'
                ? t.game.falseInfoReminder
                : t.game.arbitraryInfoReminder}
            </span>
          </div>
        )}
        <div>
          <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
            First statement
          </label>
          <textarea
            value={firstStatement}
            onChange={(event) => setFirstStatement(event.target.value)}
            rows={4}
            className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
          />
        </div>

        <div>
          <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
            Second statement
          </label>
          <textarea
            value={secondStatement}
            onChange={(event) => setSecondStatement(event.target.value)}
            rows={4}
            className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
          />
        </div>
      </div>

      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button
          onClick={() => setPhase('reveal')}
          disabled={!firstStatement.trim() || !secondStatement.trim()}
          fullWidth
          size='lg'
          variant='primary'
        >
          <Icon name='scrollText' size='md' className='mr-2' />
          Show Savant
        </Button>
      </ScreenFooter>
    </div>
  )
}

const savantDayAction: DayActionDefinition = {
  id: 'savant_advice',
  icon: 'scrollText',
  getLabel: () => 'Savant Info',
  getDescription: () => 'Give the Savant two statements: one true and one false.',
  condition: (player) => isAlive(player) && hasEffect(player, 'savant_advice'),
  ActionComponent: SavantAdviceAction,
}

const definition: EffectDefinition = {
  id: 'savant_advice',
  icon: 'scrollText',
  defaultType: 'buff',
  persistence: {
    targetRoleChange: 'remove',
  },
  dayActions: [savantDayAction],
}

export default definition
