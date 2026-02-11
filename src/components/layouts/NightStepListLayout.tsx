import { ReactNode } from 'react'
import { Icon } from '../atoms'
import { IconName } from '../atoms/icon'
import { cn } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

// ============================================================================
// STEP TYPE
// ============================================================================

export type NightStep = {
  id: string
  icon: IconName
  label: string
  status: 'pending' | 'done' | 'active'
}

// ============================================================================
// LAYOUT PROPS
// ============================================================================

type Props = {
  icon: IconName
  roleName: string
  playerName: string
  isEvil?: boolean
  steps: NightStep[]
  onSelectStep: (stepId: string) => void
  children?: ReactNode
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NightStepListLayout({
  icon,
  roleName,
  playerName,
  isEvil,
  steps,
  onSelectStep,
}: Props) {
  const { t } = useI18n()

  // Find first pending step
  const nextPendingIndex = steps.findIndex((s) => s.status === 'pending')

  return (
    <div
      className={cn(
        'min-h-app flex flex-col bg-gradient-to-b',
        isEvil
          ? 'from-red-950 via-grimoire-blood to-grimoire-darker'
          : 'from-indigo-950 via-grimoire-purple to-grimoire-darker',
      )}
    >
      {/* Header */}
      <div className='px-4 py-6 text-center'>
        <div className='flex justify-center mb-4'>
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center border',
              isEvil
                ? 'bg-red-900/30 border-red-600/40'
                : 'bg-indigo-500/10 border-indigo-400/30',
            )}
          >
            <Icon
              name={icon}
              size='3xl'
              className={cn(
                isEvil ? 'text-red-400 text-glow-crimson' : 'text-indigo-400',
              )}
            />
          </div>
        </div>

        <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-1'>
          {roleName}
        </h1>
        <p
          className={cn(
            'text-sm',
            isEvil ? 'text-red-400/70' : 'text-indigo-400/70',
          )}
        >
          {playerName}
        </p>
      </div>

      {/* Steps List */}
      <div className='flex-1 px-4 pb-6 max-w-lg mx-auto w-full'>
        <div className='flex items-center gap-2 mb-3 px-1'>
          <Icon
            name='listOrdered'
            size='sm'
            className={cn(isEvil ? 'text-red-400' : 'text-indigo-400')}
          />
          <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
            {t.game.nightSteps}
          </span>
        </div>

        <div className='space-y-1'>
          {steps.map((step, index) => {
            const isNext = index === nextPendingIndex
            const isDone = step.status === 'done'

            return (
              <button
                key={step.id}
                onClick={isNext ? () => onSelectStep(step.id) : undefined}
                disabled={!isNext}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                  isNext
                    ? isEvil
                      ? 'bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 cursor-pointer'
                      : 'bg-indigo-900/30 border border-indigo-500/40 hover:bg-indigo-900/50 cursor-pointer'
                    : isDone
                      ? 'bg-white/3 opacity-70'
                      : 'bg-white/2 opacity-50',
                )}
              >
                {/* Order number */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                    isNext
                      ? isEvil
                        ? 'bg-red-500/30 text-red-300 border border-red-400/40'
                        : 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
                      : isDone
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : 'bg-white/5 text-parchment-600 border border-white/10',
                  )}
                >
                  {isDone ? <Icon name='check' size='xs' /> : index + 1}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
                    isNext
                      ? isEvil
                        ? 'bg-red-900/30 border-red-600/30'
                        : 'bg-indigo-500/20 border-indigo-400/30'
                      : isDone
                        ? 'bg-parchment-500/10 border-parchment-500/20'
                        : 'bg-white/5 border-white/10',
                  )}
                >
                  <Icon
                    name={step.icon}
                    size='md'
                    className={cn(
                      isNext
                        ? isEvil
                          ? 'text-red-400'
                          : 'text-indigo-300'
                        : 'text-parchment-500',
                    )}
                  />
                </div>

                {/* Label */}
                <div className='flex-1 min-w-0'>
                  <div
                    className={cn(
                      'font-medium text-sm',
                      isNext
                        ? 'text-parchment-100'
                        : isDone
                          ? 'text-parchment-400'
                          : 'text-parchment-600',
                    )}
                  >
                    {step.label}
                  </div>
                </div>

                {/* Status Badge */}
                {isDone && (
                  <span className='flex items-center gap-1 text-xs text-emerald-400'>
                    <Icon name='checkCircle' size='sm' />
                    {t.game.actionDone}
                  </span>
                )}
                {isNext && (
                  <span className='flex items-center gap-1 text-xs text-indigo-300'>
                    <Icon name='arrowRight' size='sm' />
                    {t.game.nextAction}
                  </span>
                )}
                {!isDone && !isNext && (
                  <span className='flex items-center gap-1 text-xs text-parchment-600'>
                    {t.game.actionPending}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
