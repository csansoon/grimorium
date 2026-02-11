import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../../lib/i18n'
import { Button, Icon, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { getLastGamePlayers } from '../../lib/storage'

type Props = {
  onNext: (players: string[]) => void
  onBack: () => void
}

const MIN_PLAYERS = 5

export function PlayerEntry({ onNext, onBack }: Props) {
  const { t } = useI18n()
  const [players, setPlayers] = useState<string[]>(() => {
    const lastPlayers = getLastGamePlayers()
    if (lastPlayers.length >= MIN_PLAYERS) return lastPlayers
    if (lastPlayers.length > 0) {
      return [
        ...lastPlayers,
        ...Array(MIN_PLAYERS - lastPlayers.length).fill(''),
      ]
    }
    return Array(MIN_PLAYERS).fill('')
  })
  const [loadedFromLast] = useState(() => getLastGamePlayers().length > 0)
  const lastInputRef = useRef<HTMLInputElement>(null)
  const prevLengthRef = useRef(players.length)

  useEffect(() => {
    if (players.length > prevLengthRef.current && lastInputRef.current) {
      lastInputRef.current.focus()
      lastInputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    prevLengthRef.current = players.length
  }, [players.length])

  const addPlayer = () => {
    setPlayers([...players, ''])
  }

  const updatePlayer = (index: number, name: string) => {
    const updated = [...players]
    updated[index] = name
    setPlayers(updated)
  }

  const removePlayer = (index: number) => {
    if (players.length <= MIN_PLAYERS) return
    setPlayers(players.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    const validPlayers = players.filter((name) => name.trim().length > 0)
    if (validPlayers.length >= MIN_PLAYERS) {
      onNext(validPlayers)
    }
  }

  const validCount = players.filter((name) => name.trim().length > 0).length
  const canProceed = validCount >= MIN_PLAYERS

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      {/* Header */}
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

      {/* Content */}
      <div className='flex-1 px-4 py-6 max-w-lg mx-auto w-full'>
        {/* Player Count & Loaded indicator */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2 text-parchment-400'>
            <Icon name='users' size='sm' />
            <span className='text-sm tracking-wider'>
              {t.common.players} ({validCount})
            </span>
          </div>
          {loadedFromLast && (
            <span className='text-xs text-mystic-gold/60 flex items-center gap-1'>
              <Icon name='clock' size='xs' />
              {t.newGame.loadedFromLastGame}
            </span>
          )}
        </div>

        {/* Player List */}
        <div className='space-y-3 mb-6'>
          {players.map((player, index) => (
            <div key={index} className='flex gap-2'>
              <input
                ref={index === players.length - 1 ? lastInputRef : undefined}
                type='text'
                value={player}
                onChange={(e) => updatePlayer(index, e.target.value)}
                placeholder={`${t.newGame.playerPlaceholder} ${index + 1}`}
                className='flex-1 bg-white/5 border border-parchment-500/30 text-parchment-100 placeholder-parchment-500 rounded-lg px-4 py-3 focus:outline-none focus:border-mystic-gold/50 focus:ring-1 focus:ring-mystic-gold/30 transition-colors'
              />
              {players.length > MIN_PLAYERS && (
                <button
                  onClick={() => removePlayer(index)}
                  className='p-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                >
                  <Icon name='trash' size='md' />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Player Button */}
        <button
          onClick={addPlayer}
          className='w-full py-3 border border-dashed border-parchment-500/30 text-parchment-400 rounded-lg hover:border-parchment-400/50 hover:text-parchment-300 transition-colors flex items-center justify-center gap-2'
        >
          <Icon name='plus' size='md' />
          {t.newGame.addPlayer}
        </button>

        {!canProceed && (
          <p className='text-center text-mystic-gold/60 text-sm mt-4'>
            {t.newGame.minPlayersWarning}
          </p>
        )}
      </div>

      {/* Footer */}
      <ScreenFooter>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          fullWidth
          size='lg'
          variant='gold'
        >
          {t.newGame.nextSelectRoles}
          <Icon name='arrowRight' size='md' className='ml-2' />
        </Button>
      </ScreenFooter>
    </div>
  )
}
