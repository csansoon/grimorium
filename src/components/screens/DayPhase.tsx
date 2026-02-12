import { useState } from 'react'
import { GameState, PlayerState } from '../../lib/types'
import { AvailableDayAction } from '../../lib/pipeline/types'
import { useI18n, interpolate } from '../../lib/i18n'
import { Button, Icon } from '../atoms'
import { Grimoire } from '../items/Grimoire'
import { MysticDivider } from '../items'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'

type NightSummary = {
  deaths: string[]
  round: number
}

type Props = {
  state: GameState
  canNominate: boolean
  dayActions: AvailableDayAction[]
  nightSummary?: NightSummary
  onNominate: () => void
  onDayAction: (action: AvailableDayAction) => void
  onEndDay: () => void
  onMainMenu: () => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
  onOpenGrimoirePlayer?: (player: PlayerState) => void
}

export function DayPhase({
  state,
  canNominate,
  dayActions,
  nightSummary,
  onNominate,
  onDayAction,
  onEndDay,
  onMainMenu,
  onShowRoleCard,
  onEditEffects,
  onOpenGrimoirePlayer,
}: Props) {
  const { t } = useI18n()
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [grimoireExpanded, setGrimoireExpanded] = useState(false)

  const deadPlayers = nightSummary
    ? nightSummary.deaths
        .map((id) => state.players.find((p) => p.id === id))
        .filter(Boolean)
    : []

  return (
    <div className='min-h-app bg-gradient-to-b from-orange-950 via-amber-950 to-grimoire-dark flex flex-col'>
      {/* Header */}
      <div className='bg-gradient-to-b from-amber-900/50 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          {/* Menu button row */}
          <div className='flex items-center mb-4'>
            <button
              onClick={onMainMenu}
              className='p-3 -ml-3 text-parchment-500 hover:text-parchment-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center'
            >
              <Icon name='menu' size='md' />
            </button>
          </div>

          {/* Title section */}
          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon
                name='sun'
                size='3xl'
                className='text-amber-400 text-glow-gold'
              />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {t.game.day} {state.round}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {t.game.discussionAndNominations}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        {/* Night Summary Section (collapsible, default expanded) */}
        {nightSummary && (
          <div className='mb-6'>
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className='w-full flex items-center gap-2 mb-2 px-1 group'
            >
              <Icon name='moon' size='sm' className='text-indigo-400' />
              <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase flex-1 text-left'>
                {interpolate(t.game.nightSummary, {
                  round: nightSummary.round,
                })}
              </span>
              <Icon
                name={summaryExpanded ? 'chevronUp' : 'chevronDown'}
                size='sm'
                className='text-parchment-500 group-hover:text-parchment-300 transition-colors'
              />
            </button>
            {summaryExpanded && (
              <div className='bg-indigo-950/30 rounded-xl border border-indigo-500/20 p-3'>
                {deadPlayers.length === 0 ? (
                  <p className='text-parchment-400 text-sm text-center py-2'>
                    {t.game.noDeathsLastNight}
                  </p>
                ) : (
                  <div className='space-y-2'>
                    {deadPlayers.map((player) =>
                      player ? (
                        <div
                          key={player.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Icon
                            name='skull'
                            size='sm'
                            className='text-red-400'
                          />
                          <span className='text-parchment-200'>
                            {player.name}
                          </span>
                          <span className='text-red-400/70 text-xs'>
                            {interpolate(t.game.dawnDeathAnnouncement, {
                              player: player.name,
                            })}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Daytime Actions (primary section — above Grimoire) */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-3 px-1'>
            <Icon name='swords' size='sm' className='text-red-400' />
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
              {t.game.daytimeActions}
            </span>
          </div>
          <div className='space-y-2'>
            {/* Nomination Button */}
            <button
              onClick={onNominate}
              disabled={!canNominate}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors group ${
                canNominate
                  ? 'bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/30 hover:border-red-500/50'
                  : 'bg-gray-900/30 border border-gray-500/20 opacity-50 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
                  canNominate
                    ? 'bg-red-900/40 border border-red-500/40 group-hover:scale-105'
                    : 'bg-gray-900/40 border border-gray-500/30'
                }`}
              >
                <Icon
                  name='userX'
                  size='lg'
                  className={canNominate ? 'text-red-400' : 'text-gray-500'}
                />
              </div>
              <div className='flex-1 text-left'>
                <div
                  className={`font-tarot tracking-wider uppercase ${canNominate ? 'text-parchment-100' : 'text-parchment-500'}`}
                >
                  {t.game.newNomination}
                </div>
                <p className='text-parchment-500 text-xs mt-0.5'>
                  {canNominate
                    ? t.game.accusePlayerDescription
                    : t.game.executionAlreadyHappened}
                </p>
              </div>
              {canNominate && (
                <Icon
                  name='arrowRight'
                  size='md'
                  className='text-parchment-500 group-hover:text-parchment-300 transition-colors'
                />
              )}
            </button>

            {/* Dynamic Day Actions from Effects */}
            {dayActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onDayAction(action)}
                className='w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-orange-800/20 border border-amber-500/30 hover:border-amber-500/50 transition-colors group'
              >
                <div className='w-12 h-12 rounded-full bg-amber-900/40 border border-amber-500/40 flex items-center justify-center group-hover:scale-105 transition-transform'>
                  <Icon
                    name={action.icon}
                    size='lg'
                    className='text-amber-400'
                  />
                </div>
                <div className='flex-1 text-left'>
                  <div className='font-tarot text-parchment-100 tracking-wider uppercase'>
                    {action.label}
                  </div>
                  <p className='text-parchment-500 text-xs mt-0.5'>
                    {action.description}
                  </p>
                </div>
                <Icon
                  name='arrowRight'
                  size='md'
                  className='text-parchment-500 group-hover:text-parchment-300 transition-colors'
                />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <MysticDivider className='mb-6' />

        {/* Grimoire Section (collapsible, default collapsed) */}
        <div className='mb-6'>
          <button
            onClick={() => setGrimoireExpanded(!grimoireExpanded)}
            className='w-full flex items-center gap-2 mb-2 px-1 group'
          >
            <Icon name='bookUser' size='sm' className='text-mystic-gold' />
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase flex-1 text-left'>
              {t.game.grimoire}
            </span>
            <Icon
              name={grimoireExpanded ? 'chevronUp' : 'chevronDown'}
              size='sm'
              className={cn(
                'transition-colors',
                grimoireExpanded
                  ? 'text-parchment-400'
                  : 'text-parchment-500 group-hover:text-parchment-300',
              )}
            />
          </button>
          {grimoireExpanded && (
            <div className='bg-white/5 rounded-xl border border-white/10 overflow-hidden'>
              <Grimoire
                state={state}
                compact
                onPlayerSelect={onOpenGrimoirePlayer}
                onShowRoleCard={onShowRoleCard}
                onEditEffects={onEditEffects}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button onClick={onEndDay} fullWidth size='lg' variant='dawn'>
          <Icon name='moon' size='md' className='mr-2' />
          {t.game.endDayGoToNight}
        </Button>
      </ScreenFooter>
    </div>
  )
}
