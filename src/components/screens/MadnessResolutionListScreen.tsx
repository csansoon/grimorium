import { Icon, BackButton } from '../atoms'
import type { MadnessResolutionEntry } from '../../lib/madnessResolution'

type Props = {
  entries: MadnessResolutionEntry[]
  onOpen: (entry: MadnessResolutionEntry) => void
  onBack: () => void
}

export function MadnessResolutionListScreen({
  entries,
  onOpen,
  onBack,
}: Props) {
  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='max-w-lg mx-auto'>
          <div className='flex items-center gap-3 mb-3'>
            <BackButton onClick={onBack} />
            <div>
              <div className='font-tarot text-xl uppercase tracking-widest-xl text-parchment-100'>
                Resolve Madness
              </div>
              <div className='text-sm text-parchment-400'>
                Review active madness and any pending consequences.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto'>
        {entries.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-parchment-500'>
            No madness pressure is waiting right now.
          </div>
        ) : (
          <div className='space-y-3'>
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onOpen(entry)}
                className='w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/30 hover:border-red-500/50 transition-colors group'
              >
                <div className='w-12 h-12 rounded-full bg-red-900/40 border border-red-500/40 flex items-center justify-center group-hover:scale-105 transition-transform'>
                  <Icon name={entry.icon} size='lg' className='text-red-400' />
                </div>
                <div className='flex-1 text-left min-w-0'>
                  <div className='font-tarot text-parchment-100 tracking-wider uppercase'>
                    {entry.title}
                  </div>
                  <div className='text-xs uppercase tracking-[0.18em] text-red-200/70 mt-1'>
                    {entry.status === 'pending' ? 'Pending consequence' : 'Active madness'}
                  </div>
                  <p className='text-parchment-500 text-xs mt-1 line-clamp-2'>
                    {entry.description}
                  </p>
                </div>
                <Icon
                  name='arrowRight'
                  size='md'
                  className='text-parchment-500 group-hover:text-parchment-300 transition-colors'
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
