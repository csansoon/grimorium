import { useI18n } from '../../lib/i18n'
import { SCRIPTS, ScriptId } from '../../lib/scripts'
import { Icon, BackButton } from '../atoms'
import { cn } from '../../lib/utils'

type Props = {
  players: string[]
  onSelect: (scriptId: ScriptId) => void
  onBack: () => void
}

const SCRIPT_ORDER: ScriptId[] = ['trouble-brewing', 'custom']

export function ScriptSelection({ players, onSelect, onBack }: Props) {
  const { t } = useI18n()

  const getScriptName = (id: ScriptId) => {
    return t.scripts[id as keyof typeof t.scripts] ?? id
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <BackButton onClick={onBack} />
          <div className='flex-1'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {t.scripts.selectScript}
            </h1>
            <p className='text-xs text-parchment-500'>
              {t.scripts.selectScriptSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Player count badge */}
      <div className='px-4 py-3 bg-white/5 border-b border-white/10'>
        <div className='max-w-lg mx-auto flex items-center gap-2'>
          <Icon name='users' size='sm' className='text-mystic-gold/70' />
          <span className='text-sm text-parchment-300'>
            {players.length} {t.common.players.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Script cards */}
      <div className='flex-1 px-4 py-6 max-w-lg mx-auto w-full'>
        <div className='space-y-4'>
          {SCRIPT_ORDER.map((scriptId) => {
            const script = SCRIPTS[scriptId]
            const isCustom = scriptId === 'custom'

            return (
              <button
                key={scriptId}
                type='button'
                onClick={() => onSelect(scriptId)}
                className={cn(
                  'w-full rounded-2xl border-2 transition-all',
                  'p-5 text-left',
                  'active:scale-[0.98]',
                  isCustom
                    ? 'border-parchment-500/30 bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-parchment-400/40'
                    : 'border-mystic-gold/30 bg-gradient-to-br from-mystic-gold/10 to-mystic-gold/[0.02] hover:border-mystic-gold/50',
                )}
                style={
                  !isCustom
                    ? {
                        boxShadow:
                          '0 0 20px rgba(212, 175, 55, 0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                      }
                    : undefined
                }
              >
                <div className='flex items-start gap-4'>
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      isCustom
                        ? 'bg-parchment-500/10 border border-parchment-500/20'
                        : 'bg-mystic-gold/10 border border-mystic-gold/30',
                    )}
                  >
                    <Icon
                      name={script.icon}
                      size='lg'
                      className={
                        isCustom ? 'text-parchment-400' : 'text-mystic-gold'
                      }
                    />
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <h2
                      className={cn(
                        'font-tarot text-base tracking-wider uppercase mb-1',
                        isCustom ? 'text-parchment-200' : 'text-mystic-gold',
                      )}
                    >
                      {getScriptName(scriptId)}
                    </h2>
                    <p className='text-xs text-parchment-500 leading-relaxed'>
                      {isCustom
                        ? t.scripts.freeformSelection
                        : t.scripts.enforceDistribution}
                    </p>

                    {/* Role count */}
                    {!isCustom && (
                      <div className='mt-2 flex items-center gap-1.5'>
                        <Icon
                          name='users'
                          size='xs'
                          className='text-parchment-500'
                        />
                        <span className='text-[11px] text-parchment-500'>
                          {script.roles.length} {t.common.roles.toLowerCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <Icon
                    name='chevronRight'
                    size='md'
                    className={cn(
                      'flex-shrink-0 mt-1',
                      isCustom
                        ? 'text-parchment-500/50'
                        : 'text-mystic-gold/50',
                    )}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
