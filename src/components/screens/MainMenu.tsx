import {
  getGameSummaries,
  getCurrentGameId,
  GameSummary,
} from '../../lib/storage'
import { useI18n } from '../../lib/i18n'
import { Icon } from '../atoms'
import { MysticDivider } from '../items'
import { cn } from '../../lib/utils'

type Props = {
  onNewGame: () => void
  onContinue: (gameId: string) => void
  onLoadGame: (gameId: string) => void
  onRolesLibrary: () => void
}

export function MainMenu({
  onNewGame,
  onContinue,
  onLoadGame,
  onRolesLibrary,
}: Props) {
  const { language, t } = useI18n()
  const games = getGameSummaries()
  const currentGameId = getCurrentGameId()
  const currentGame = games.find((g) => g.id === currentGameId)

  const formatDate = (timestamp: number) => {
    const locale = language === 'es' ? 'es-ES' : 'en-US'
    return new Date(timestamp).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPhase = (game: GameSummary) => {
    if (game.phase === 'ended') return t.mainMenu.completed
    if (game.phase === 'setup') return t.mainMenu.settingUp
    return `${t.mainMenu.round} ${game.round} - ${game.phase}`
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col p-4'>
      {/* Space for floating language toggle */}
      <div className='h-8 mb-4' />

      <div className='flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full'>
        {/* Logo Section */}
        <div className='text-center mb-10'>
          {/* Mystical Eye Icon */}
          <div className='mb-6'>
            <div className='w-20 h-20 mx-auto rounded-full bg-mystic-gold/10 border border-mystic-gold/30 flex items-center justify-center shadow-tarot-glow'>
              <Icon
                name='eye'
                size='3xl'
                className='text-mystic-gold text-glow-gold'
              />
            </div>
          </div>

          <h1 className='font-tarot text-3xl sm:text-4xl font-bold text-parchment-100 tracking-widest-xl uppercase mb-3'>
            {t.mainMenu.title}
          </h1>
          <p className='text-parchment-400 text-sm tracking-wider'>
            {t.mainMenu.subtitle}
          </p>

          {/* Decorative divider */}
          <MysticDivider className='mt-6' />
        </div>

        {/* Main Actions */}
        <div className='w-full space-y-4 mb-8'>
          {/* Continue Current Game */}
          {currentGame && currentGame.phase !== 'ended' && (
            <button
              onClick={() => onContinue(currentGame.id)}
              className='w-full p-4 rounded-xl bg-gradient-to-r from-mystic-gold/20 to-mystic-bronze/20 border border-mystic-gold/40 hover:border-mystic-gold/60 transition-all group'
            >
              <div className='flex items-center justify-between'>
                <div className='text-left'>
                  <div className='font-tarot text-lg text-mystic-gold tracking-wider uppercase'>
                    {t.mainMenu.continueGame}
                  </div>
                  <div className='text-sm text-parchment-400 mt-1'>
                    {currentGame.name} • {formatPhase(currentGame)}
                  </div>
                </div>
                <Icon
                  name='play'
                  size='lg'
                  className='text-mystic-gold group-hover:scale-110 transition-transform'
                />
              </div>
            </button>
          )}

          {/* New Game */}
          <button
            onClick={onNewGame}
            className='w-full p-4 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 hover:border-indigo-400/50 transition-all group'
          >
            <div className='flex items-center justify-between'>
              <div className='text-left'>
                <div className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
                  {t.mainMenu.newGame}
                </div>
                <div className='text-sm text-parchment-400 mt-1'>
                  {t.mainMenu.startFreshGame}
                </div>
              </div>
              <Icon
                name='sparkles'
                size='lg'
                className='text-indigo-400 group-hover:scale-110 transition-transform'
              />
            </div>
          </button>

          {/* Roles Library */}
          <button
            onClick={onRolesLibrary}
            className='w-full p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-mystic-gold/20 hover:border-mystic-gold/40 transition-all group'
          >
            <div className='flex items-center justify-between'>
              <div className='text-left'>
                <div className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
                  {t.mainMenu.rolesLibrary}
                </div>
                <div className='text-sm text-parchment-400 mt-1'>
                  {t.mainMenu.browseAllRoles}
                </div>
              </div>
              <Icon
                name='bookMarked'
                size='lg'
                className='text-mystic-gold group-hover:scale-110 transition-transform'
              />
            </div>
          </button>
        </div>

        {/* Previous Games - Simple List */}
        {games.length > 0 && (
          <div className='w-full'>
            <div className='flex items-center gap-2 mb-3 text-parchment-400'>
              <Icon name='history' size='sm' />
              <span className='text-sm tracking-wider uppercase'>
                {t.mainMenu.previousGames}
              </span>
            </div>
            <div className='space-y-1'>
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => onLoadGame(game.id)}
                  className='w-full py-3 px-4 text-left hover:bg-white/5 rounded-lg transition-colors group min-h-[44px]'
                >
                  <div className='flex items-start gap-3'>
                    <Icon
                      name={game.phase === 'ended' ? 'checkCircle' : 'circle'}
                      size='sm'
                      className={cn(
                        'mt-0.5 shrink-0',
                        game.phase === 'ended'
                          ? 'text-green-500/70'
                          : 'text-parchment-500',
                      )}
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='text-parchment-200 group-hover:text-parchment-100 truncate'>
                        {game.name}
                      </div>
                      <div className='text-xs text-parchment-500'>
                        {game.playerCount} {t.common.players.toLowerCase()} •{' '}
                        {formatPhase(game)} • {formatDate(game.createdAt)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
