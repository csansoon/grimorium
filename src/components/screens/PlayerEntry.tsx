import { useMemo, useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { getRecommendedDistribution } from '../../lib/scripts'
import { Button, Icon, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { getLastGamePlayers } from '../../lib/storage'

type Props = {
  onNext: (playerCount: number) => void
  onBack: () => void
  initialPlayerCount?: number
}

const MIN_PLAYERS = 5
const MAX_PLAYERS = 15

function clampPlayerCount(value: number) {
  return Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, value))
}

export function PlayerEntry({
  onNext,
  onBack,
  initialPlayerCount,
}: Props) {
  const { t } = useI18n()
  const [playerCount, setPlayerCount] = useState(() => {
    if (initialPlayerCount) return clampPlayerCount(initialPlayerCount)

    const lastGameCount = getLastGamePlayers().length
    if (lastGameCount >= MIN_PLAYERS) return clampPlayerCount(lastGameCount)

    return 8
  })

  const recommended = useMemo(
    () => getRecommendedDistribution(playerCount),
    [playerCount],
  )

  const teamCards = recommended
    ? [
        {
          key: 'townsfolk',
          label: t.teams.townsfolk.name,
          count: recommended.townsfolk,
          icon: 'shield' as const,
          className:
            'border-mystic-gold/30 bg-mystic-gold/10 text-mystic-gold',
        },
        {
          key: 'outsider',
          label: t.teams.outsider.name,
          count: recommended.outsider,
          icon: 'ghost' as const,
          className:
            'border-mystic-silver/30 bg-mystic-silver/10 text-parchment-200',
        },
        {
          key: 'minion',
          label: t.teams.minion.name,
          count: recommended.minion,
          icon: 'swords' as const,
          className: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
        },
        {
          key: 'demon',
          label: t.teams.demon.name,
          count: recommended.demon,
          icon: 'flame' as const,
          className: 'border-red-500/30 bg-red-500/10 text-red-300',
        },
      ]
    : []

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <BackButton onClick={onBack} />
          <div>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {t.newGame.step1Title}
            </h1>
            <p className='text-xs text-parchment-500'>
              {t.newGame.step1Subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className='flex-1 px-4 py-6 max-w-lg mx-auto w-full'>
        <div className='rounded-2xl border border-mystic-gold/20 bg-gradient-to-br from-mystic-gold/10 via-white/[0.04] to-transparent p-5 shadow-[0_0_30px_rgba(212,175,55,0.08)] mb-5'>
          <div className='flex items-start justify-between gap-4 mb-5'>
            <div>
              <p className='text-xs tracking-[0.3em] uppercase text-parchment-500 mb-2'>
                {t.newGame.playerCountLabel}
              </p>
              <div className='flex items-end gap-3'>
                <span className='font-tarot text-5xl leading-none text-mystic-gold'>
                  {playerCount}
                </span>
                <span className='text-sm text-parchment-400 pb-1'>
                  {t.common.players.toLowerCase()}
                </span>
              </div>
            </div>
            <div className='w-14 h-14 rounded-2xl bg-mystic-gold/10 border border-mystic-gold/20 flex items-center justify-center flex-shrink-0'>
              <Icon name='users' size='xl' className='text-mystic-gold' />
            </div>
          </div>

          <p className='text-sm text-parchment-400 leading-relaxed mb-5'>
            {t.newGame.playerCountHelp}
          </p>

          <div className='px-1'>
            <input
              type='range'
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              step={1}
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className='w-full h-2 rounded-full accent-mystic-gold bg-white/10 cursor-pointer'
            />
            <div className='flex justify-between text-[11px] text-parchment-500 mt-3 px-1'>
              {[5, 7, 9, 11, 13, 15].map((count) => (
                <span key={count}>{count}</span>
              ))}
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-white/10 bg-white/5 p-5'>
          <div className='flex items-center gap-2 mb-4'>
            <Icon name='scrollText' size='sm' className='text-mystic-gold' />
            <h2 className='font-tarot text-sm tracking-wider uppercase text-parchment-100'>
              {t.newGame.recommendedSplit}
            </h2>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {teamCards.map((team) => (
              <div
                key={team.key}
                className={`rounded-xl border p-4 ${team.className}`}
              >
                <div className='flex items-center justify-between gap-2 mb-3'>
                  <Icon name={team.icon} size='sm' />
                  <span className='text-xs uppercase tracking-[0.22em] opacity-80'>
                    {team.label}
                  </span>
                </div>
                <div className='font-tarot text-3xl leading-none'>
                  {team.count}
                </div>
              </div>
            ))}
          </div>

          <p className='text-xs text-parchment-500 mt-4 leading-relaxed'>
            {t.newGame.seatsAutoGenerated}
          </p>
        </div>
      </div>

      <ScreenFooter>
        <Button onClick={() => onNext(playerCount)} fullWidth size='lg' variant='gold'>
          {t.scripts.selectScript}
        </Button>
      </ScreenFooter>
    </div>
  )
}
