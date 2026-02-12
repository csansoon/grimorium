import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type ScreenFooterProps = {
  borderColor?: string
  children: ReactNode
}

export function ScreenFooter({
  borderColor = 'border-mystic-gold/20',
  children,
}: ScreenFooterProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 bg-grimoire-dark/95 backdrop-blur-sm border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
        borderColor,
      )}
    >
      <div className='max-w-lg mx-auto'>{children}</div>
    </div>
  )
}
