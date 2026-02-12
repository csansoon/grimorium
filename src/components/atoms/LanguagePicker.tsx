import * as Popover from '@radix-ui/react-popover'
import { useI18n, LANGUAGES } from '../../lib/i18n'
import { Icon } from './icon'

type Props = {
  variant?: 'button' | 'floating'
  className?: string
}

export function LanguagePicker({
  variant = 'button',
  className = '',
}: Props) {
  const { language, setLanguage } = useI18n()
  const current = LANGUAGES.find((l) => l.code === language)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {variant === 'floating' ? (
          <button
            className={`w-12 h-12 rounded-full bg-grimoire-dark/90 border border-mystic-gold/30 text-mystic-gold flex items-center justify-center shadow-lg hover:bg-grimoire-dark hover:border-mystic-gold/50 active:scale-95 transition-all text-sm font-medium ${className}`}
            title={current?.nativeName}
          >
            <Icon name="globe" size="md" />
          </button>
        ) : (
          <button
            className={`flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-full border border-mystic-gold/30 text-mystic-gold/70 hover:text-mystic-gold hover:border-mystic-gold/50 active:scale-95 transition-all text-sm ${className}`}
          >
            <Icon name="globe" size="sm" />
            {current?.nativeName ?? language.toUpperCase()}
          </button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-[100] min-w-[200px] rounded-xl bg-grimoire-dark border border-mystic-gold/30 shadow-xl overflow-hidden origin-top-right data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out"
        >
          <div className="py-1">
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === language
              return (
                <Popover.Close key={lang.code} asChild>
                  <button
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 min-h-[48px] text-left transition-colors ${
                      isActive
                        ? 'bg-mystic-gold/15 text-mystic-gold'
                        : 'text-parchment-300 active:bg-white/10'
                    }`}
                  >
                    <span className="flex-1 text-[15px] font-medium">
                      {lang.nativeName}
                    </span>
                    {isActive && (
                      <Icon
                        name="check"
                        size="sm"
                        className="text-mystic-gold shrink-0"
                      />
                    )}
                  </button>
                </Popover.Close>
              )
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
