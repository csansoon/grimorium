import { useEffect, useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { BackButton, Icon } from '../atoms'

type Props = {
  notes: string
  onChange: (notes: string) => void
  onClose: () => void
  onShowHistory: () => void
}

export function StorytellerNotesView({
  notes,
  onChange,
  onClose,
  onShowHistory,
}: Props) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(notes)

  useEffect(() => {
    setDraft(notes)
  }, [notes])

  return (
    <div className='min-h-app bg-gradient-to-b from-amber-950 via-orange-950/70 to-grimoire-dark flex flex-col'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='max-w-lg mx-auto flex items-center gap-3'>
          <BackButton onClick={onClose} />
          <div className='min-w-0 flex-1'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {t.game.storytellerNotes}
            </h1>
          </div>
          <button
            onClick={onShowHistory}
            className='min-h-[44px] rounded-full border border-parchment-500/20 px-3 text-sm text-parchment-300 transition-colors hover:border-parchment-400/40 hover:text-parchment-100'
          >
            {t.game.viewHistory}
          </button>
        </div>
      </div>

      <div className='flex-1 px-4 py-5'>
        <div className='max-w-lg mx-auto'>
          <div className='rounded-2xl border border-white/10 bg-grimoire-dark/50 p-4 shadow-lg backdrop-blur-sm'>
            <div className='flex items-start gap-3'>
              <div className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mystic-gold/20 bg-mystic-gold/10 text-mystic-gold'>
                <Icon name='pencil' size='md' />
              </div>
              <div className='min-w-0 flex-1'>
                <h2 className='font-tarot text-base uppercase tracking-[0.2em] text-parchment-100'>
                  {t.common.notes}
                </h2>
                <p className='mt-1 text-sm text-parchment-400'>
                  {t.game.storytellerNotesDescription}
                </p>
              </div>
            </div>

            <textarea
              value={draft}
              onChange={(event) => {
                const nextNotes = event.target.value
                setDraft(nextNotes)
                onChange(nextNotes)
              }}
              placeholder={t.game.storytellerNotesPlaceholder}
              className='mt-4 min-h-[48vh] w-full rounded-2xl border border-white/10 bg-grimoire-dark/80 px-4 py-4 text-sm leading-relaxed text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
