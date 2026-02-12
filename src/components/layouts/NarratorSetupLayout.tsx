import { ReactNode } from 'react'
import { Icon, Button } from '../atoms'
import { IconName } from '../atoms/icon'
import { ScreenFooter } from './ScreenFooter'
import { useI18n, interpolate } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { NightStepAudience } from '../../lib/roles/types'

type NarratorSetupLayoutProps = {
  icon: IconName
  roleName: string
  playerName: string
  children: ReactNode
  footer?: ReactNode
  // If provided, shows a default "Show to Player" button
  onShowToPlayer?: () => void
  showToPlayerDisabled?: boolean
  showToPlayerLabel?: string
  /**
   * Who this screen is for. Affects background gradient and shows a contextual banner.
   * - `narrator` — blue/indigo background, "This is your decision" banner
   * - `player_choice` — amber/warm background, "Wake player and ask them" banner
   * If omitted, defaults to narrator styling.
   */
  audience?: NightStepAudience
}

export function NarratorSetupLayout({
  icon,
  roleName,
  playerName,
  children,
  footer,
  onShowToPlayer,
  showToPlayerDisabled,
  showToPlayerLabel,
  audience,
}: NarratorSetupLayoutProps) {
  const { t } = useI18n()

  const isPlayerChoice = audience === 'player_choice'

  return (
    <div
      className={cn(
        'min-h-app flex flex-col bg-gradient-to-b',
        isPlayerChoice
          ? 'from-amber-950 via-orange-950/50 to-grimoire-darker'
          : 'from-indigo-950 via-grimoire-purple to-grimoire-darker',
      )}
    >
      {/* Audience Banner */}
      {audience === 'narrator' && (
        <div className='mx-4 mt-4 mb-0 max-w-lg self-center w-full'>
          <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/30 border border-blue-500/30'>
            <Icon name='eye' size='sm' className='text-blue-400 flex-shrink-0' />
            <span className='text-blue-300 text-xs'>
              {t.game.storytellerDecision}
            </span>
          </div>
        </div>
      )}
      {isPlayerChoice && (
        <div className='mx-4 mt-4 mb-0 max-w-lg self-center w-full'>
          <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/40 border border-amber-500/40'>
            <Icon
              name='userRound'
              size='sm'
              className='text-amber-400 flex-shrink-0'
            />
            <span className='text-amber-300 text-xs font-medium'>
              {interpolate(t.game.wakePlayerPrompt, { player: playerName })}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={cn(
          'px-4 py-6 text-center',
          !isPlayerChoice && 'bg-gradient-to-b from-blue-900/50 to-transparent',
          isPlayerChoice && 'bg-gradient-to-b from-amber-900/30 to-transparent',
        )}
      >
        <div className='flex justify-center mb-3'>
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center border',
              isPlayerChoice
                ? 'bg-amber-500/20 border-amber-400/30'
                : 'bg-blue-500/20 border-blue-400/30',
            )}
          >
            <Icon
              name={icon}
              size='2xl'
              className={cn(isPlayerChoice ? 'text-amber-300' : 'text-blue-300')}
            />
          </div>
        </div>
        <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase'>
          {t.game.narratorSetup}
        </h1>
        <p className='text-parchment-400 text-sm mt-1'>
          {roleName} - {playerName}
        </p>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        {children}
      </div>

      {/* Footer */}
      <ScreenFooter
        borderColor={
          isPlayerChoice ? 'border-amber-500/30' : 'border-blue-500/30'
        }
      >
        {footer ?? (
          <Button
            onClick={onShowToPlayer}
            disabled={showToPlayerDisabled}
            fullWidth
            size='lg'
            variant='night'
          >
            <Icon name='eye' size='md' className='mr-2' />
            {showToPlayerLabel ?? t.game.showToPlayer}
          </Button>
        )}
      </ScreenFooter>
    </div>
  )
}
