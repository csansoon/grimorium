import { Button, Icon, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { getRoleName, useI18n } from '../../lib/i18n'
import type { DayActionResult } from '../../lib/pipeline/types'
import type { GameState } from '../../lib/types'
import {
  buildMarkMadnessBrokenResult,
  buildResolvePendingMadnessResult,
  type MadnessResolutionEntry,
} from '../../lib/madnessResolution'

type Props = {
  state: GameState
  entry: MadnessResolutionEntry
  onComplete: (result: DayActionResult) => void
  onBack: () => void
}

export function MadnessResolutionScreen({
  state,
  entry,
  onComplete,
  onBack,
}: Props) {
  const { t, language } = useI18n()
  const player = state.players.find((candidate) => candidate.id === entry.playerId)
  if (!player) return null

  const showExecute = entry.status === 'pending' && state.phase === 'day'
  const showKill = entry.status === 'pending'
  const showDismiss = entry.status === 'pending'
  const showMarkBroken = entry.status === 'active'

  return (
    <div className='min-h-app bg-gradient-to-b from-red-950 via-rose-950 to-grimoire-dark flex flex-col'>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          <div className='flex items-center mb-4'>
            <BackButton onClick={onBack} />
            <span className='text-parchment-500 text-xs ml-1'>{t.common.back}</span>
          </div>
          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name={entry.icon} size='3xl' className='text-red-400 text-glow-red' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {entry.title}
            </h1>
            <p className='text-parchment-400 text-sm'>{entry.description}</p>
          </div>
        </div>
      </div>

      <div className='flex-1 px-6 py-8 max-w-lg mx-auto w-full space-y-4'>
        <div className='rounded-2xl border border-red-500/20 bg-white/5 px-5 py-5 text-center'>
          <div className='text-sm uppercase tracking-[0.24em] text-red-200/70 mb-2'>
            Player
          </div>
          <div className='text-2xl font-semibold text-parchment-100'>{player.name}</div>
          {entry.madAsRoleId ? (
            <div className='text-sm text-parchment-400 mt-3'>
              Mad as {getRoleName(entry.madAsRoleId, language)}
            </div>
          ) : null}
          <div className='text-xs text-parchment-500 mt-3 uppercase tracking-[0.2em]'>
            {entry.status === 'pending' ? 'Pending consequence' : 'Active madness'}
          </div>
        </div>

        {showMarkBroken ? (
          <div className='rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-parchment-200'>
            Record the madness break now. You can execute or quietly kill this player later from the pending consequence queue.
          </div>
        ) : null}

        {showKill ? (
          <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-parchment-300'>
            Quiet kill works in any phase. During the night, that lets you hide the source among other deaths.
          </div>
        ) : null}
      </div>

      <ScreenFooter borderColor='border-red-500/30'>
        <div className='flex flex-col gap-3'>
          {showMarkBroken ? (
            <Button
              onClick={() => onComplete(buildMarkMadnessBrokenResult(state, entry))}
              fullWidth
              size='lg'
              variant='slayer'
            >
              <Icon name='drama' size='md' className='mr-2' />
              Mark Broken
            </Button>
          ) : null}

          {showExecute ? (
            <Button
              onClick={() =>
                onComplete(buildResolvePendingMadnessResult(entry, 'execute'))
              }
              fullWidth
              size='lg'
              variant='slayer'
            >
              <Icon name='zapOff' size='md' className='mr-2' />
              Execute Now
            </Button>
          ) : null}

          {showKill ? (
            <Button
              onClick={() => onComplete(buildResolvePendingMadnessResult(entry, 'kill'))}
              fullWidth
              size='lg'
              variant='night'
            >
              <Icon name='skull' size='md' className='mr-2' />
              Kill Quietly
            </Button>
          ) : null}

          {showDismiss ? (
            <Button
              onClick={() =>
                onComplete(buildResolvePendingMadnessResult(entry, 'dismiss'))
              }
              fullWidth
              size='lg'
              variant='ghost'
            >
              Clear Pressure
            </Button>
          ) : null}
        </div>
      </ScreenFooter>
    </div>
  )
}
