import * as Popover from '@radix-ui/react-popover'
import { useI18n } from '../../lib/i18n'
import { Icon, type IconName } from '../atoms'

type Action = {
  id: string
  icon: IconName
  label: string
  onSelect: () => void
}

type Props = {
  onShowGrimoire: () => void
  onShowCharacters: () => void
  onTakeNotes: () => void
  onShowHistory: () => void
}

function MenuAction({ action }: { action: Action }) {
  return (
    <Popover.Close asChild>
      <button
        onClick={action.onSelect}
        className='w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-parchment-200 transition-colors hover:bg-white/8'
      >
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mystic-gold/20 bg-mystic-gold/10 text-mystic-gold'>
          <Icon name={action.icon} size='md' />
        </div>
        <span className='text-sm font-medium'>{action.label}</span>
      </button>
    </Popover.Close>
  )
}

export function StorytellerFabMenu({
  onShowGrimoire,
  onShowCharacters,
  onTakeNotes,
  onShowHistory,
}: Props) {
  const { t } = useI18n()

  const actions: Action[] = [
    {
      id: 'grimoire',
      icon: 'bookUser',
      label: t.game.showGrimoire,
      onSelect: onShowGrimoire,
    },
    {
      id: 'characters',
      icon: 'users',
      label: t.game.showAllCharacters,
      onSelect: onShowCharacters,
    },
    {
      id: 'notes',
      icon: 'pencil',
      label: t.game.takeNotes,
      onSelect: onTakeNotes,
    },
    {
      id: 'history',
      icon: 'history',
      label: t.common.history,
      onSelect: onShowHistory,
    },
  ]

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className='w-12 h-12 rounded-full bg-grimoire-dark/90 border border-mystic-gold/30 text-mystic-gold flex items-center justify-center shadow-lg hover:bg-grimoire-dark hover:border-mystic-gold/50 transition-colors'
          title={t.game.storytellerMenu}
          aria-label={t.game.storytellerMenu}
        >
          <Icon name='menu' size='md' />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side='top'
          align='end'
          sideOffset={12}
          collisionPadding={16}
          className='z-[100] w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-mystic-gold/25 bg-grimoire-dark/95 p-2 shadow-xl backdrop-blur-md origin-bottom-right data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out'
        >
          <div className='px-3 pb-2 pt-1 text-[11px] uppercase tracking-[0.24em] text-parchment-500'>
            {t.game.storytellerMenu}
          </div>
          <div className='space-y-1'>
            {actions.map((action) => (
              <MenuAction key={action.id} action={action} />
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
