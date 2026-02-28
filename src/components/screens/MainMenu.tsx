import { useCallback, useRef, useState } from 'react'
import {
  getGameSummaries,
  getCurrentGameId,
  GameSummary,
} from '../../lib/storage'
import { useI18n } from '../../lib/i18n'
import { Icon } from '../atoms'
import { MysticDivider } from '../items'
import { useShaderBackground } from '../../hooks/useShaderBackground'
import { cn } from '../../lib/utils'

// =============================================================================
// GRIMOIRE BACKGROUND SHADER
// =============================================================================

/**
 * Dark mystical background — swirling purple mist, faint arcane ring geometry,
 * gold dust particles rising, warm center glow. Designed to be atmospheric
 * and subtle: a living backdrop, not a spectacle.
 */
const GRIMOIRE_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash(i);
  float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0));
  float d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.55;
  mat2 m = mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){
    v += a*noise(p);
    p = m*p + 0.07;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  float screenScale = clamp(600.0 / max(u_resolution.x, u_resolution.y), 1.0, 1.5);
  p *= screenScale;

  float t = u_time * 0.06;

  // Dark swirling mist — two fbm layers for depth
  float mist1 = fbm(p * 2.0 + vec2(t * 0.8, -t * 0.5));
  float mist2 = fbm(p * 3.0 + vec2(-t * 0.6, t * 0.4));
  float mist = mist1 * 0.6 + mist2 * 0.4;

  // Faint arcane ring — slowly drifting center
  vec2 center = vec2(
    0.5 * (u_resolution.x / u_resolution.y) * screenScale,
    0.5 * screenScale
  );
  vec2 q = p - center;
  float r = length(q);
  float angle = atan(q.y, q.x);

  // Outer ring
  float ring = 1.0 - smoothstep(0.005, 0.018, abs(r - 0.30));
  ring *= 0.12;

  // Tick marks (12 positions, rotating slowly)
  float ticks = pow(max(0.0, cos((angle + t * 0.3) * 6.0)), 30.0);
  float tickMask = smoothstep(0.30 + 0.05, 0.30 + 0.01, r)
                 * smoothstep(0.30 - 0.05, 0.30 - 0.01, r);
  ticks *= tickMask * 0.10;

  // Inner ring
  float innerRing = 1.0 - smoothstep(0.004, 0.014, abs(r - 0.22));
  innerRing *= 0.07;

  // Gold dust particles rising
  vec2 sp = uv;
  sp.y += t * 0.5;
  vec2 grid = floor(sp * vec2(50.0, 70.0));
  float rnd = hash(grid);
  vec2 f = fract(sp * vec2(50.0, 70.0));
  float dust = step(0.992, rnd) * smoothstep(0.35, 0.0, length(f - 0.5));
  dust *= 0.5 + 0.5 * sin(rnd * 6.283 + u_time * 1.5);

  // Central warm glow
  float glow = smoothstep(0.55, 0.0, length(uv - 0.5));

  // Heavy vignette
  vec2 vc = uv - 0.5;
  float vig = smoothstep(1.1, 0.15, dot(vc, vc));

  // Color palette
  vec3 deep   = vec3(0.02, 0.01, 0.05);
  vec3 mid    = vec3(0.06, 0.03, 0.14);
  vec3 bright = vec3(0.10, 0.05, 0.22);
  vec3 gold   = vec3(0.85, 0.65, 0.20);

  vec3 col = mix(deep, mid, mist * 0.7);
  col = mix(col, bright, smoothstep(0.4, 0.8, mist) * 0.35);

  // Arcane geometry (gold tinted)
  col += gold * (ring + ticks + innerRing);

  // Gold dust
  col += gold * dust * 0.5;

  // Central glow (warm purple + gold hint)
  col += vec3(0.06, 0.03, 0.10) * glow * 0.4;
  col += gold * glow * 0.015;

  col *= vig;
  gl_FragColor = vec4(col, 1.0);
}
`

// =============================================================================
// MODULE STATE
// =============================================================================

/** Survives component remounts within the same page session */
let hasOpenedGrimoire = false

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  onNewGame: () => void
  onContinue: (gameId: string) => void
  onLoadGame: (gameId: string) => void
  onRolesLibrary: () => void
  onHowToPlay: () => void
}

type Phase = 'sealed' | 'breaking' | 'open'

// =============================================================================
// BURST PARTICLE GEOMETRY
// =============================================================================

const BURST_PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2
  return {
    x: Math.cos(angle) * 90,
    y: Math.sin(angle) * 90,
    delay: i * 25,
  }
})

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MainMenu({
  onNewGame,
  onContinue,
  onLoadGame,
  onRolesLibrary,
  onHowToPlay,
}: Props) {
  const { language, t } = useI18n()
  const games = getGameSummaries()
  const currentGameId = getCurrentGameId()
  const currentGame = games.find((g) => g.id === currentGameId)
  const hasActiveGame = !!(currentGame && currentGame.phase !== 'ended')

  const [phase, setPhase] = useState<Phase>(() =>
    hasOpenedGrimoire ? 'open' : 'sealed',
  )
  const [showPastGames, setShowPastGames] = useState(false)
  const [pastGamesClosing, setPastGamesClosing] = useState(false)

  // Shader background
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useShaderBackground(canvasRef, GRIMOIRE_SHADER)

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleBreakSeal = useCallback(() => {
    if (phase !== 'sealed') return
    setPhase('breaking')
    setTimeout(() => {
      hasOpenedGrimoire = true
      setPhase('open')
    }, 700)
  }, [phase])

  const openPastGames = useCallback(() => {
    setShowPastGames(true)
    setPastGamesClosing(false)
  }, [])

  const closePastGames = useCallback(() => {
    setPastGamesClosing(true)
    setTimeout(() => {
      setShowPastGames(false)
      setPastGamesClosing(false)
    }, 250)
  }, [])

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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className='min-h-app relative flex flex-col'>
      {/* Shader background canvas */}
      <canvas
        ref={canvasRef}
        className='absolute inset-0 w-full h-full bg-grimoire-darker'
      />

      {/* Content layer */}
      <div className='relative z-10 flex-1 flex flex-col p-4'>
        {/* Space for floating language toggle */}
        <div className='h-8 shrink-0' />

        <div className='flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full'>
          {phase !== 'open' ? (
            /* ═══════════ SEALED / BREAKING VIEW ═══════════ */
            <button
              onClick={handleBreakSeal}
              className='flex flex-col items-center text-center focus:outline-none active:scale-[0.98] transition-transform'
              aria-label={t.mainMenu.tapToOpen}
            >
              {/* Arcane Seal */}
              <div className='relative w-36 h-36 sm:w-44 sm:h-44 mb-8'>
                {/* Outer ring */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-full border border-mystic-gold/20',
                    phase === 'breaking'
                      ? 'grimoire-seal-break'
                      : 'card-seal-outer',
                  )}
                  style={
                    phase === 'breaking'
                      ? ({
                        '--break-duration': '600ms',
                      } as React.CSSProperties)
                      : undefined
                  }
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className='absolute top-0 left-1/2 -translate-x-1/2 h-full'
                      style={{
                        transform: `rotate(${(360 / 12) * i}deg)`,
                      }}
                    >
                      <div className='w-px h-2.5 mx-auto bg-mystic-gold/20' />
                    </div>
                  ))}
                </div>

                {/* Inner ring */}
                <div
                  className={cn(
                    'absolute inset-4 sm:inset-5 rounded-full border border-mystic-gold/15',
                    phase === 'breaking'
                      ? 'grimoire-seal-break'
                      : 'card-seal-inner',
                  )}
                  style={
                    phase === 'breaking'
                      ? ({
                        '--break-duration': '600ms',
                        '--break-delay': '60ms',
                      } as React.CSSProperties)
                      : undefined
                  }
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className='absolute top-0 left-1/2 -translate-x-1/2 h-full'
                      style={{
                        transform: `rotate(${(360 / 8) * i}deg)`,
                      }}
                    >
                      <div className='w-px h-2 mx-auto bg-mystic-gold/15' />
                    </div>
                  ))}
                </div>

                {/* Eye icon center */}
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center',
                    phase === 'breaking' && 'grimoire-seal-fade',
                  )}
                >
                  <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-mystic-gold/10 border border-mystic-gold/30 flex items-center justify-center shadow-tarot-glow'>
                    <Icon
                      name='eye'
                      size='3xl'
                      className='text-mystic-gold text-glow-gold'
                    />
                  </div>
                </div>

                {/* Burst particles (only during break) */}
                {phase === 'breaking' &&
                  BURST_PARTICLES.map((particle, i) => (
                    <div
                      key={i}
                      className='grimoire-burst-particle'
                      style={
                        {
                          left: '50%',
                          top: '50%',
                          marginLeft: '-3px',
                          marginTop: '-3px',
                          '--burst-x': `${particle.x}px`,
                          '--burst-y': `${particle.y}px`,
                          '--burst-delay': `${particle.delay}ms`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
              </div>

              {/* Title & subtitle */}
              <div
                className={cn(phase === 'breaking' && 'grimoire-seal-fade')}
              >
                <h1 className='font-tarot text-3xl sm:text-4xl font-bold text-parchment-100 tracking-widest-xl uppercase mb-3'>
                  {t.mainMenu.title}
                </h1>
                <p className='text-parchment-400 text-sm tracking-wider mb-6'>
                  {t.mainMenu.subtitle}
                </p>
                <MysticDivider />
              </div>

              {/* Tap to open prompt */}
              <p
                className={cn(
                  'mt-8 text-parchment-400/60 text-sm tracking-widest uppercase',
                  phase === 'sealed' && 'animate-breathe',
                  phase === 'breaking' && 'grimoire-seal-fade',
                )}
              >
                {t.mainMenu.tapToOpen}
              </p>
            </button>
          ) : (
            /* ═══════════ OPEN VIEW ═══════════ */
            <>
              {/* Compact title */}
              <div
                className='text-center mb-8 grimoire-menu-reveal'
                style={
                  { '--reveal-delay': '0ms' } as React.CSSProperties
                }
              >
                <h1 className='font-tarot text-2xl sm:text-3xl font-bold text-parchment-100 tracking-widest-xl uppercase mb-2'>
                  {t.mainMenu.title}
                </h1>
                <MysticDivider />
              </div>

              {/* Action Cards */}
              <div className='w-full space-y-4 mb-10'>
                {/* Continue Game */}
                {hasActiveGame && currentGame && (
                  <div
                    className='grimoire-menu-reveal'
                    style={
                      { '--reveal-delay': '80ms' } as React.CSSProperties
                    }
                  >
                    <button
                      onClick={() => onContinue(currentGame.id)}
                      className='relative w-full p-5 rounded-xl bg-gradient-to-r from-mystic-gold/15 to-mystic-bronze/10 border border-mystic-gold/25 card-border-glow transition-all group'
                      style={
                        {
                          '--glow-color': 'rgba(212, 175, 55, 0.3)',
                        } as React.CSSProperties
                      }
                    >
                      <div className='flex items-center justify-between'>
                        <div className='text-left'>
                          <div className='font-tarot text-lg text-mystic-gold tracking-wider uppercase'>
                            {t.mainMenu.continueGame}
                          </div>
                          <div className='text-sm text-parchment-400 mt-1'>
                            {currentGame.name} •{' '}
                            {formatPhase(currentGame)}
                          </div>
                        </div>
                        <Icon
                          name='play'
                          size='lg'
                          className='text-mystic-gold group-hover:scale-110 transition-transform'
                        />
                      </div>
                    </button>
                  </div>
                )}

                {/* New Game */}
                <div
                  className='grimoire-menu-reveal'
                  style={
                    {
                      '--reveal-delay': hasActiveGame ? '160ms' : '80ms',
                    } as React.CSSProperties
                  }
                >
                  <button
                    onClick={onNewGame}
                    className='relative w-full p-5 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/25 card-border-glow transition-all group'
                    style={
                      {
                        '--glow-color': 'rgba(99, 102, 241, 0.25)',
                      } as React.CSSProperties
                    }
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
                </div>
              </div>

              {/* Footer links */}
              <div
                className='flex flex-wrap justify-center items-center gap-x-3 gap-y-3 px-4 grimoire-menu-reveal'
                style={
                  {
                    '--reveal-delay': hasActiveGame ? '280ms' : '200ms',
                  } as React.CSSProperties
                }
              >
                <button
                  onClick={onHowToPlay}
                  className='text-sm text-parchment-400 hover:text-parchment-200 underline underline-offset-4 decoration-1 decoration-parchment-500/40 transition-colors tracking-wider'
                >
                  {t.howToPlay.title}
                </button>

                <span className='text-parchment-500/40 hidden sm:inline'>·</span>

                <button
                  onClick={onRolesLibrary}
                  className='text-sm text-parchment-400 hover:text-parchment-200 underline underline-offset-4 decoration-1 decoration-parchment-500/40 transition-colors tracking-wider'
                >
                  {t.mainMenu.rolesLibrary}
                </button>

                {games.length > 0 && (
                  <>
                    <span className='text-parchment-500/40'>·</span>
                    <button
                      onClick={openPastGames}
                      className='text-sm text-parchment-400 hover:text-parchment-200 underline underline-offset-4 decoration-1 decoration-parchment-500/40 transition-colors tracking-wider'
                    >
                      {t.mainMenu.previousGames}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════ PAST GAMES BOTTOM SHEET ═══════════ */}
      {showPastGames && (
        <div className='fixed inset-0 z-50'>
          {/* Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-black/60',
              pastGamesClosing ? 'animate-overlay-out' : 'animate-overlay-in',
            )}
            onClick={closePastGames}
          />

          {/* Sheet */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 bg-grimoire-dark rounded-t-2xl border-t border-parchment-500/10 max-h-[70vh] flex flex-col',
              pastGamesClosing ? 'animate-sheet-out' : 'animate-sheet-in',
            )}
          >
            {/* Drag handle */}
            <div className='flex justify-center pt-3 pb-1'>
              <div className='w-10 h-1 rounded-full bg-parchment-500/30' />
            </div>

            {/* Header */}
            <div className='flex items-center justify-between px-5 py-3'>
              <div className='flex items-center gap-2 text-parchment-300'>
                <Icon name='history' size='sm' />
                <span className='font-tarot text-lg tracking-wider uppercase'>
                  {t.mainMenu.previousGames}
                </span>
              </div>
              <button
                onClick={closePastGames}
                className='p-2 -mr-2 rounded-lg hover:bg-white/5 transition-colors'
              >
                <Icon name='x' size='sm' className='text-parchment-400' />
              </button>
            </div>

            {/* Game list */}
            <div className='flex-1 overflow-y-auto px-3 pb-8'>
              <div className='space-y-1'>
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      closePastGames()
                      onLoadGame(game.id)
                    }}
                    className='w-full py-3 px-4 text-left hover:bg-white/5 rounded-lg transition-colors group min-h-[44px]'
                  >
                    <div className='flex items-start gap-3'>
                      <Icon
                        name={
                          game.phase === 'ended' ? 'checkCircle' : 'circle'
                        }
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
                          {game.playerCount}{' '}
                          {t.common.players.toLowerCase()} •{' '}
                          {formatPhase(game)} •{' '}
                          {formatDate(game.createdAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
