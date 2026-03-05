import { useMemo, useState } from 'react'
import { BackButton, Button, Icon } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { useI18n, getRoleName } from '../../lib/i18n'
import {
  deriveScriptWakeOrderFromRoleIds,
  EditableScriptDraft,
  ScriptWakeEntry,
} from '../../lib/scripts'
import { RoleId } from '../../lib/roles/types'
import { getRole } from '../../lib/roles'
import { cn } from '../../lib/utils'
import { getVisibleWakeEntries } from '../../lib/scripts/wakeOrder'

type Props = {
  playerCount: number
  draftScript: EditableScriptDraft
  onBack: () => void
  onSave: (draftScript: EditableScriptDraft) => void
}

type WakePhase = 'firstNight' | 'otherNights'

function sanitizePhaseOrder(
  entries: ScriptWakeEntry[],
  allowedEntries: ScriptWakeEntry[],
): ScriptWakeEntry[] {
  const allowedByRole = new Map(
    allowedEntries.map((entry) => [entry.roleId, entry]),
  )
  const sanitized = entries
    .filter((entry) => allowedByRole.has(entry.roleId))
    .map((entry) => ({
      ...(allowedByRole.get(entry.roleId) ?? entry),
      ...entry,
    }))
  const seen = new Set(sanitized.map((entry) => entry.roleId))

  for (const entry of allowedEntries) {
    if (!seen.has(entry.roleId)) {
      sanitized.push(entry)
    }
  }

  return sanitized
}

function mergeHiddenWakeEntries(
  visibleEntries: ScriptWakeEntry[],
  fullEntries: ScriptWakeEntry[],
): ScriptWakeEntry[] {
  const visibleQueue = [...visibleEntries]

  return fullEntries.map((entry) => {
    if (entry.hidden) {
      return entry
    }

    return visibleQueue.shift() ?? entry
  })
}

export function ScriptWakeOrderEditor({
  playerCount,
  draftScript,
  onBack,
  onSave,
}: Props) {
  const { t, language } = useI18n()
  const defaults = useMemo(
    () => deriveScriptWakeOrderFromRoleIds(draftScript.roles),
    [draftScript.roles],
  )
  const defaultVisibleFirstNight = useMemo(
    () => getVisibleWakeEntries(defaults.firstNight),
    [defaults.firstNight],
  )
  const defaultVisibleOtherNights = useMemo(
    () => getVisibleWakeEntries(defaults.otherNights),
    [defaults.otherNights],
  )
  const initialVisibleFirstNight = useMemo(
    () => getVisibleWakeEntries(draftScript.wakeOrder.firstNight),
    [draftScript.wakeOrder.firstNight],
  )
  const initialVisibleOtherNights = useMemo(
    () => getVisibleWakeEntries(draftScript.wakeOrder.otherNights),
    [draftScript.wakeOrder.otherNights],
  )
  const [name, setName] = useState(draftScript.name)
  const [author, setAuthor] = useState(draftScript.author ?? '')
  const [activePhase, setActivePhase] = useState<WakePhase>('firstNight')
  const [firstNight, setFirstNight] = useState<ScriptWakeEntry[]>(
    sanitizePhaseOrder(initialVisibleFirstNight, defaultVisibleFirstNight),
  )
  const [otherNights, setOtherNights] = useState<ScriptWakeEntry[]>(
    sanitizePhaseOrder(initialVisibleOtherNights, defaultVisibleOtherNights),
  )
  const [draggingRoleId, setDraggingRoleId] = useState<RoleId | null>(null)

  const currentRoles = activePhase === 'firstNight' ? firstNight : otherNights

  const updatePhaseOrder = (phase: WakePhase, entries: ScriptWakeEntry[]) => {
    if (phase === 'firstNight') {
      setFirstNight(entries)
      return
    }
    setOtherNights(entries)
  }

  const moveRole = (phase: WakePhase, roleId: RoleId, direction: -1 | 1) => {
    const entries = phase === 'firstNight' ? firstNight : otherNights
    const index = entries.findIndex((entry) => entry.roleId === roleId)
    const nextIndex = index + direction
    if (index === -1 || nextIndex < 0 || nextIndex >= entries.length) return

    const nextEntries = [...entries]
    const [moved] = nextEntries.splice(index, 1)
    nextEntries.splice(nextIndex, 0, moved)
    updatePhaseOrder(phase, nextEntries)
  }

  const reorderPhase = (
    phase: WakePhase,
    sourceRoleId: RoleId,
    targetRoleId: RoleId,
  ) => {
    const entries = phase === 'firstNight' ? firstNight : otherNights
    const sourceIndex = entries.findIndex(
      (entry) => entry.roleId === sourceRoleId,
    )
    const targetIndex = entries.findIndex(
      (entry) => entry.roleId === targetRoleId,
    )
    if (
      sourceIndex === -1 ||
      targetIndex === -1 ||
      sourceIndex === targetIndex
    ) {
      return
    }

    const nextEntries = [...entries]
    const [moved] = nextEntries.splice(sourceIndex, 1)
    nextEntries.splice(targetIndex, 0, moved)
    updatePhaseOrder(phase, nextEntries)
  }

  const handleReset = () => {
    setFirstNight(defaultVisibleFirstNight)
    setOtherNights(defaultVisibleOtherNights)
  }

  const handleSave = () => {
    onSave({
      ...draftScript,
      name: name.trim() || draftScript.name,
      author: author.trim() || undefined,
      wakeOrder: {
        firstNight: mergeHiddenWakeEntries(
          sanitizePhaseOrder(firstNight, defaultVisibleFirstNight),
          defaults.firstNight,
        ),
        otherNights: mergeHiddenWakeEntries(
          sanitizePhaseOrder(otherNights, defaultVisibleOtherNights),
          defaults.otherNights,
        ),
      },
    })
  }

  const heading =
    draftScript.source === 'imported'
      ? t.scripts.wakeOrderImportTitle
      : t.scripts.wakeOrderCustomTitle

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <BackButton onClick={onBack} />
          <div className='flex-1 min-w-0'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {heading}
            </h1>
            <p className='text-xs text-parchment-500'>
              {t.scripts.wakeOrderSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className='px-4 py-3 bg-white/5 border-b border-white/10'>
        <div className='max-w-lg mx-auto flex items-center justify-between gap-2 text-sm text-parchment-300'>
          <div className='flex items-center gap-2'>
            <Icon name='users' size='sm' className='text-mystic-gold/70' />
            <span>
              {playerCount} {t.common.players.toLowerCase()}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Icon name='scrollText' size='sm' className='text-mystic-gold/70' />
            <span>
              {draftScript.roles.length} {t.common.roles.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-4'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div>
            <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
              {t.scripts.scriptNameLabel}
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
            />
          </div>
          <div>
            <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
              {t.scripts.scriptAuthorLabel}
            </label>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder={t.scripts.scriptAuthorPlaceholder}
              className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
            />
          </div>
        </div>

        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-1 flex gap-1'>
          {(['firstNight', 'otherNights'] as WakePhase[]).map((phase) => (
            <button
              key={phase}
              type='button'
              onClick={() => setActivePhase(phase)}
              className={cn(
                'flex-1 rounded-xl px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors',
                activePhase === phase
                  ? 'bg-mystic-gold/15 text-mystic-gold border border-mystic-gold/30'
                  : 'text-parchment-500',
              )}
            >
              {phase === 'firstNight'
                ? t.scripts.firstNightWakeOrder
                : t.scripts.otherNightWakeOrder}
            </button>
          ))}
        </div>

        <div className='rounded-2xl border border-mystic-gold/20 bg-black/15 overflow-hidden'>
          <div className='flex items-center justify-between px-4 py-3 border-b border-white/10'>
            <div>
              <h2 className='font-tarot text-sm uppercase tracking-[0.18em] text-parchment-100'>
                {activePhase === 'firstNight'
                  ? t.scripts.firstNightWakeOrder
                  : t.scripts.otherNightWakeOrder}
              </h2>
              <p className='text-xs text-parchment-500 mt-1'>
                {t.scripts.wakeOrderHint}
              </p>
            </div>
            <button
              type='button'
              onClick={handleReset}
              className='rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-parchment-300 hover:text-parchment-100'
            >
              {t.scripts.resetWakeOrder}
            </button>
          </div>

          {currentRoles.length === 0 ? (
            <div className='px-4 py-6 text-sm text-parchment-500'>
              {t.scripts.noWakeRoles}
            </div>
          ) : (
            <div className='divide-y divide-white/10'>
              {currentRoles.map((entry, index) => {
                const roleId = entry.roleId
                const role = getRole(roleId)
                const isReactive = (entry.mode ?? 'active') === 'reactive'

                return (
                  <div
                    key={`${activePhase}-${roleId}`}
                    draggable
                    onDragStart={() => setDraggingRoleId(roleId)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingRoleId) return
                      reorderPhase(activePhase, draggingRoleId, roleId)
                      setDraggingRoleId(null)
                    }}
                    onDragEnd={() => setDraggingRoleId(null)}
                    className={cn(
                      'px-4 py-3 flex items-center gap-3 bg-transparent transition-colors',
                      draggingRoleId === roleId && 'bg-mystic-gold/10',
                    )}
                  >
                    <div className='w-8 h-8 rounded-full border border-mystic-gold/25 bg-mystic-gold/10 flex items-center justify-center text-xs text-mystic-gold'>
                      {index + 1}
                    </div>
                    <div className='w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-parchment-300'>
                      <Icon name='gripVertical' size='sm' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <div className='text-sm text-parchment-100'>
                          {getRoleName(roleId, language)}
                        </div>
                        {isReactive && (
                          <span className='rounded-full border border-indigo-400/25 bg-indigo-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-indigo-200'>
                            {t.scripts.conditionalWakeTag}
                          </span>
                        )}
                      </div>
                      <div className='text-xs text-parchment-500 uppercase tracking-[0.14em]'>
                        {role?.team ?? ''}
                      </div>
                      {entry.note && (
                        <div className='text-xs text-parchment-400 mt-1'>
                          {entry.note}
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                      <button
                        type='button'
                        onClick={() => moveRole(activePhase, roleId, -1)}
                        className='w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-parchment-300 disabled:opacity-30'
                        disabled={index === 0}
                      >
                        <Icon name='chevronUp' size='sm' />
                      </button>
                      <button
                        type='button'
                        onClick={() => moveRole(activePhase, roleId, 1)}
                        className='w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-parchment-300 disabled:opacity-30'
                        disabled={index === currentRoles.length - 1}
                      >
                        <Icon name='chevronDown' size='sm' />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ScreenFooter>
        <Button onClick={handleSave} fullWidth size='lg' variant='gold'>
          <Icon name='checkCircle' size='md' className='mr-2' />
          {t.scripts.saveScript}
        </Button>
      </ScreenFooter>
    </div>
  )
}
