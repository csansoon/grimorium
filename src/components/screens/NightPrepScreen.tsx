import { useState } from 'react'
import { Game, GameState } from '../../lib/types'
import { useI18n, getRoleName } from '../../lib/i18n'
import { Button, Icon, IconName } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'
import { StorytellerGrimoireBoard } from '../items'

export type NightPrepItem = {
  playerId: string
  playerName: string
  roleId: string
  roleIcon: IconName
}

export type NightPrepSummaryItem = NightPrepItem & {
  details: string[]
}

type Props = {
  game: Game
  state: GameState
  items: NightPrepItem[]
  completedItems: NightPrepSummaryItem[]
  onOpenSetup: (playerId: string, roleId: string) => void
  onOpenPlayer?: (playerId: string) => void
  onSwapPlayers?: (sourcePlayerId: string, targetPlayerId: string) => void
  onContinue: () => void
}

export function NightPrepScreen({
  state,
  items,
  completedItems,
  onOpenSetup,
  onOpenPlayer,
  onSwapPlayers,
  onContinue,
}: Props) {
  const { t, language } = useI18n()
  const [reseatMode, setReseatMode] = useState(false)
  const [swapSourcePlayerId, setSwapSourcePlayerId] = useState<string | null>(
    null,
  )

  const allDone = items.length === 0

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='bg-gradient-to-b from-mystic-gold/10 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon
                name='sparkles'
                size='3xl'
                className='text-mystic-gold text-glow-gold'
              />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {t.game.setupActions}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {t.game.setupActionsSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        <div className='space-y-5'>
          <StorytellerGrimoireBoard
            state={state}
            title={t.game.grimoireCircle}
            onPlayerSelect={(player) => {
              if (reseatMode) {
                setSwapSourcePlayerId((current) =>
                  current === player.id ? null : player.id,
                )
                return
              }
              onOpenPlayer?.(player.id)
            }}
            onPlayerSwap={(sourcePlayerId, targetPlayerId) => {
              onSwapPlayers?.(sourcePlayerId, targetPlayerId)
              setSwapSourcePlayerId(null)
            }}
            reseatMode={reseatMode}
            swapSourcePlayerId={swapSourcePlayerId}
            onToggleReseatMode={() => {
              setReseatMode((current) => !current)
              setSwapSourcePlayerId(null)
            }}
          />

          <section>
            <h2 className='text-xs font-medium text-parchment-500 uppercase tracking-[0.24em] mb-3'>
              {t.game.nightPrepPending}
            </h2>

            <div className='space-y-2'>
              {items.map((item) => (
                <button
                  key={`${item.playerId}-${item.roleId}`}
                  onClick={() => onOpenSetup(item.playerId, item.roleId)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-lg transition-colors text-left group',
                    'bg-amber-900/10 hover:bg-amber-900/20 border border-amber-700/30 hover:border-amber-600/50',
                  )}
                >
                  <div className='w-10 h-10 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0'>
                    <Icon
                      name={item.roleIcon}
                      size='md'
                      className='text-amber-400'
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-sm text-parchment-100'>
                      {item.playerName}
                    </div>
                    <span className='text-xs text-amber-400'>
                      {getRoleName(item.roleId, language)}
                    </span>
                  </div>
                  <div className='flex items-center gap-1 text-amber-400 group-hover:text-amber-300'>
                    <Icon name='sparkles' size='md' />
                  </div>
                </button>
              ))}

              {allDone && (
                <div className='text-center py-8'>
                  <Icon
                    name='checkCircle'
                    size='xl'
                    className='text-emerald-500 mx-auto mb-2'
                  />
                  <p className='text-parchment-400 text-sm'>
                    {t.game.allSetupActionsComplete}
                  </p>
                </div>
              )}
            </div>
          </section>

          {completedItems.length > 0 && (
            <section>
              <h2 className='text-xs font-medium text-parchment-500 uppercase tracking-[0.24em] mb-3'>
                {t.game.nightPrepSummary}
              </h2>

              <div className='space-y-2'>
                {completedItems.map((item) => (
                  <button
                    key={`${item.playerId}-${item.roleId}-done`}
                    onClick={() => onOpenSetup(item.playerId, item.roleId)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-lg text-left transition-colors group',
                      'bg-emerald-900/10 border border-emerald-700/25 hover:bg-emerald-900/20 hover:border-emerald-600/35',
                    )}
                  >
                    <div className='w-10 h-10 rounded-full bg-emerald-900/20 border border-emerald-700/40 flex items-center justify-center flex-shrink-0'>
                      <Icon
                        name={item.roleIcon}
                        size='md'
                        className='text-emerald-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-sm text-parchment-100'>
                        {item.playerName}
                      </div>
                      <div className='text-xs text-emerald-300 mb-2'>
                        {getRoleName(item.roleId, language)}
                      </div>
                      <div className='space-y-1'>
                        {item.details.map((detail, index) => (
                          <p
                            key={`${item.playerId}-${item.roleId}-detail-${index}`}
                            className='text-xs text-parchment-300'
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                    <Icon
                      name='pencil'
                      size='md'
                      className='text-emerald-400 group-hover:text-emerald-300 flex-shrink-0'
                    />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <ScreenFooter>
        <Button
          onClick={onContinue}
          disabled={!allDone}
          fullWidth
          size='lg'
          variant='dawn'
        >
          <Icon name='moon' size='md' className='mr-2' />
          {t.game.startFirstNight}
        </Button>
      </ScreenFooter>
    </div>
  )
}
