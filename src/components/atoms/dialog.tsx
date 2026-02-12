import * as React from 'react'
import { useRef, useState, useCallback } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useDrag } from '@use-gesture/react'
import { cn } from '../../lib/utils'
import { Icon } from './icon'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
      'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// ============================================================================
// DRAG-TO-DISMISS CONSTANTS
// ============================================================================

/** Distance in px the user must drag to trigger a dismiss */
const DISMISS_THRESHOLD = 120
/** Velocity threshold for a quick flick dismiss (px/ms) */
const VELOCITY_THRESHOLD = 0.5

// ============================================================================
// DIALOG CONTENT WITH DRAG-TO-DISMISS
// ============================================================================

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const dismiss = useCallback(() => {
    // Just click close. The sheet stays at its current drag position via
    // the CSS `translate` property, which is independent of the `transform`
    // used by Radix's close animation. The close animation composes on top
    // of the drag offset — the sheet continues downward naturally.
    // animationend fires normally, Radix unmounts, fresh state on next open.
    closeRef.current?.click()
  }, [])

  // Reset drag state when the open animation starts. This handles the case
  // where the component isn't fully unmounted between close/open cycles —
  // dragY might still have the old value. Resetting during sheet-in is safe
  // because the sheet is at translateY(100%) (off-screen) at that point,
  // so removing the translate offset is invisible.
  const handleAnimationStart = useCallback((e: React.AnimationEvent) => {
    if (e.animationName === 'sheet-in') {
      setDragY(0)
      setIsDragging(false)
    }
  }, [])

  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], direction: [, dy], first, last, cancel, memo }) => {
      if (first) {
        const scrollable = bodyRef.current
        if (scrollable && scrollable.scrollTop > 0) {
          cancel()
          return
        }
        return true
      }

      const clampedY = Math.max(0, my)

      if (last) {
        setIsDragging(false)
        if (clampedY > DISMISS_THRESHOLD || (vy > VELOCITY_THRESHOLD && dy > 0)) {
          dismiss()
        } else {
          setDragY(0)
        }
        return memo
      }

      setIsDragging(true)
      setDragY(clampedY)
      return memo
    },
    {
      axis: 'y',
      filterTaps: true,
      from: [0, 0],
      pointer: { touch: true },
    },
  )

  // Compute overlay opacity based on drag distance
  const overlayOpacity = dragY > 0 ? Math.max(0, 1 - dragY / 400) : undefined

  // Use CSS `translate` for drag offset — this is independent of `transform`
  // which the Radix open/close animations use. They compose without conflict.
  const contentStyle: React.CSSProperties & Record<string, string> = {}
  if (dragY > 0) {
    contentStyle.translate = `0 ${dragY}px`
  }
  if (!isDragging && dragY > 0) {
    // Smooth snap-back transition when releasing below threshold
    contentStyle.transition = 'translate 300ms ease-out'
  }

  return (
    <DialogPortal>
      <DialogOverlay
        style={overlayOpacity !== undefined ? { opacity: overlayOpacity } : undefined}
      />
      <DialogPrimitive.Content
        ref={ref}
        onAnimationStart={handleAnimationStart}
        className={cn(
          'fixed z-50 w-full max-w-lg',
          // Mobile: bottom sheet style
          'bottom-0 left-0 right-0 max-h-[85vh]',
          // Styling
          'bg-grimoire-dark border-t border-mystic-gold/30 rounded-t-2xl',
          'overflow-hidden flex flex-col',
          // Keyframe animations for open/close — uses `transform` which is
          // independent of the CSS `translate` property used for drag offset
          'data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out',
          className,
        )}
        style={contentStyle}
        {...props}
      >
        {/* Drag handle area — main drag target */}
        <div {...bind()} className='flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none'>
          <div className={cn(
            'w-12 h-1 rounded-full transition-all duration-150',
            isDragging ? 'bg-parchment-500/60 w-16' : 'bg-parchment-500/30',
          )} />
        </div>
        <DialogContentInner bodyRef={bodyRef}>
          {children}
        </DialogContentInner>
        <DialogPrimitive.Close
          ref={closeRef}
          className='absolute right-4 top-4 p-2 rounded-full text-parchment-400 hover:text-parchment-100 hover:bg-white/10 active:bg-white/20 transition-colors'
        >
          <Icon name='x' size='md' />
          <span className='sr-only'>Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * Inner wrapper that passes the body ref to DialogBody children via context.
 * This lets the drag handler know when the body is scrolled.
 */
const DialogBodyRefContext = React.createContext<React.RefObject<HTMLDivElement | null> | null>(null)

function DialogContentInner({
  children,
  bodyRef,
}: {
  children: React.ReactNode
  bodyRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <DialogBodyRefContext.Provider value={bodyRef}>
      {children}
    </DialogBodyRefContext.Provider>
  )
}

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 pb-4 text-center', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-tarot text-xl text-parchment-100 tracking-wider uppercase',
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-parchment-400', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const bodyRef = React.useContext(DialogBodyRefContext)

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (bodyRef) {
        ;(bodyRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [bodyRef],
  )

  return (
    <div
      ref={setRef}
      className={cn('flex-1 overflow-y-auto px-6 pb-6', className)}
      {...props}
    />
  )
}
DialogBody.displayName = 'DialogBody'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
}
