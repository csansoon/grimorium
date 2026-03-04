import { useMemo } from 'react'
import {
  getBuiltinScripts,
  getSavedScripts,
  type ScriptDefinition,
  type ScriptId,
} from '../../lib/scripts'
import { useI18n } from '../../lib/i18n'
import { Icon, BackButton } from '../atoms'
import { cn } from '../../lib/utils'

type Props = {
  playerCount: number
  onSelect: (scriptId: ScriptId) => void
  onImport: () => void
  onEditScript: (scriptId: ScriptId) => void
  onBack: () => void
}

export function ScriptSelection({
  playerCount,
  onSelect,
  onImport,
  onEditScript,
  onBack,
}: Props) {
  const { t } = useI18n()

  const builtInScripts = useMemo(
    () => getBuiltinScripts().filter((script) => script.id !== 'custom'),
    [],
  )
  const savedScripts = useMemo(() => getSavedScripts(), [])

  const getScriptName = (script: ScriptDefinition) => {
    if (script.id === 'trouble-brewing') return t.scripts['trouble-brewing']
    if (script.id === 'sects-and-violets') return t.scripts['sects-and-violets']
    if (script.id === 'custom') return t.scripts.custom
    return script.name
  }

  const renderScriptCard = (
    script: ScriptDefinition,
    options?: {
      selectable?: boolean
      editable?: boolean
      accent?: 'gold' | 'parchment'
      beta?: boolean
    },
  ) => {
    const selectable = options?.selectable ?? true
    const editable = options?.editable ?? false
    const accent = options?.accent ?? 'gold'
    const beta = options?.beta ?? false
    const isGold = accent === 'gold'

    return (
      <div
        key={script.id}
        className={cn(
          'rounded-2xl border-2 transition-all p-5',
          isGold
            ? 'border-mystic-gold/30 bg-gradient-to-br from-mystic-gold/10 to-mystic-gold/[0.02]'
            : 'border-parchment-500/30 bg-gradient-to-br from-white/5 to-white/[0.02]',
        )}
      >
        <div className='flex items-start gap-4'>
          <button
            type='button'
            onClick={() => selectable && onSelect(script.id)}
            className='flex-1 min-w-0 flex items-start gap-4 text-left'
          >
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                isGold
                  ? 'bg-mystic-gold/10 border border-mystic-gold/30'
                  : 'bg-parchment-500/10 border border-parchment-500/20',
              )}
            >
              <Icon
                name={script.icon}
                size='lg'
                className={isGold ? 'text-mystic-gold' : 'text-parchment-300'}
              />
            </div>

            <div className='flex-1 min-w-0'>
              <h2
                className={cn(
                  'font-tarot text-base tracking-wider uppercase mb-1 flex items-center gap-2',
                  isGold ? 'text-mystic-gold' : 'text-parchment-100',
                )}
              >
                <span>{getScriptName(script)}</span>
                {beta && (
                  <span className='inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-1.5 py-px text-[9px] font-sans font-semibold tracking-[0.14em] text-amber-300 leading-none'>
                    {t.scripts.betaTag}
                  </span>
                )}
              </h2>
              <p className='text-xs text-parchment-500 leading-relaxed'>
                {script.author
                  ? t.scripts.byAuthor.replace('{author}', script.author)
                  : script.enforceDistribution
                    ? t.scripts.enforceDistribution
                    : t.scripts.freeformSelection}
              </p>
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
            </div>
          </button>

          <div className='flex items-center gap-2'>
            {editable && (
              <button
                type='button'
                onClick={() => onEditScript(script.id)}
                className='w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-parchment-300'
                aria-label={t.scripts.editWakeOrder}
              >
                <Icon name='pencil' size='sm' />
              </button>
            )}
            {selectable && (
              <button
                type='button'
                onClick={() => onSelect(script.id)}
                className='w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-parchment-300'
                aria-label={t.common.next}
              >
                <Icon name='chevronRight' size='sm' />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
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

      <div className='px-4 py-3 bg-white/5 border-b border-white/10'>
        <div className='max-w-lg mx-auto flex items-center gap-2'>
          <Icon name='users' size='sm' className='text-mystic-gold/70' />
          <span className='text-sm text-parchment-300'>
            {playerCount} {t.common.players.toLowerCase()}
          </span>
        </div>
      </div>

      <div className='flex-1 px-4 py-6 max-w-lg mx-auto w-full overflow-y-auto space-y-6'>
        <section className='space-y-4'>
          <div className='flex items-center gap-2 px-1'>
            <Icon name='star' size='sm' className='text-mystic-gold' />
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
              {t.scripts.officialScripts}
            </span>
          </div>
          {builtInScripts.map((script) =>
            renderScriptCard(script, {
              beta: script.id === 'sects-and-violets',
            }),
          )}
        </section>

        <section className='space-y-4'>
          <div className='flex items-center gap-2 px-1'>
            <Icon name='settings' size='sm' className='text-parchment-300' />
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
              {t.scripts.scriptTools}
            </span>
          </div>

          <button
            type='button'
            onClick={onImport}
            className='w-full rounded-2xl border-2 border-mystic-gold/20 bg-gradient-to-br from-mystic-gold/10 to-white/[0.02] p-5 text-left'
          >
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 rounded-xl bg-mystic-gold/10 border border-mystic-gold/30 flex items-center justify-center'>
                <Icon name='globe' size='lg' className='text-mystic-gold' />
              </div>
              <div className='flex-1 min-w-0'>
                <h2 className='font-tarot text-base tracking-wider uppercase mb-1 text-mystic-gold'>
                  <span className='flex items-center gap-2'>
                    <span>{t.scripts.importScript}</span>
                    <span className='inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-1.5 py-px text-[9px] font-sans font-semibold tracking-[0.14em] text-amber-300 leading-none'>
                      {t.scripts.betaTag}
                    </span>
                  </span>
                </h2>
                <p className='text-xs text-parchment-500 leading-relaxed'>
                  {t.scripts.importScriptHelp}
                </p>
              </div>
              <Icon
                name='chevronRight'
                size='md'
                className='text-mystic-gold/50 mt-1'
              />
            </div>
          </button>

          {renderScriptCard(
            getBuiltinScripts().find((script) => script.id === 'custom')!,
            { accent: 'parchment' },
          )}
        </section>

        {savedScripts.length > 0 && (
          <section className='space-y-4'>
            <div className='flex items-center gap-2 px-1'>
              <Icon name='bookMarked' size='sm' className='text-parchment-300' />
              <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
                {t.scripts.savedScripts}
              </span>
            </div>
            {savedScripts.map((script) =>
              renderScriptCard(script, {
                editable: true,
                accent: script.source === 'imported' ? 'gold' : 'parchment',
              }),
            )}
          </section>
        )}
      </div>
    </div>
  )
}
