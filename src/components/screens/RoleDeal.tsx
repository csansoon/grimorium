import { useState } from 'react'
import { getAllRoles, getRole } from '../../lib/roles'
import { RoleId } from '../../lib/roles/types'
import { ScriptId, getRoleIdsForScript } from '../../lib/scripts'
import { getTeam } from '../../lib/teams'
import { useI18n } from '../../lib/i18n'
import { createInitialState } from '../../lib/types'
import { BackButton, Button, Icon } from '../atoms'
import { RoleCard, TeamBackground } from '../items'
import { RolePickerGrid } from '../inputs'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'

type PreparedAutoSetup =
  | { kind: 'none' }
  | { kind: 'drunk'; believedRoleId: RoleId | null }

export type PreparedRoleAssignment = {
  slotId: string
  baseRoleId: RoleId
  displayRoleId: RoleId
  playerName: string
  locked: boolean
  revealOrder: number | null
  autoSetup: PreparedAutoSetup
}

type Props = {
  playerCount: number
  scriptId: ScriptId
  selectedRoles: string[]
  onComplete: (assignments: PreparedRoleAssignment[]) => void
  onBack: () => void
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function buildPreparedAssignments(
  selectedRoles: string[],
): PreparedRoleAssignment[] {
  const shuffledRoles = shuffle(selectedRoles as RoleId[])

  const assignments: PreparedRoleAssignment[] = shuffledRoles.map(
    (roleId, index) => ({
      slotId: `slot-${index + 1}`,
      baseRoleId: roleId,
      displayRoleId: roleId,
      playerName: '',
      locked: false,
      revealOrder: null,
      autoSetup: { kind: 'none' },
    }),
  )

  assignments.forEach((assignment, index) => {
    if (assignment.baseRoleId === 'drunk') {
      assignments[index] = {
        ...assignment,
        displayRoleId: 'drunk',
        autoSetup: { kind: 'drunk', believedRoleId: null },
      }
    }
  })
  return assignments
}

function getAssignmentsInSeatingOrder(
  assignments: PreparedRoleAssignment[],
): PreparedRoleAssignment[] {
  return [...assignments].sort((a, b) => {
    const aOrder = a.revealOrder ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.revealOrder ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.slotId.localeCompare(b.slotId)
  })
}

export function RoleDeal({
  playerCount,
  scriptId,
  selectedRoles,
  onComplete,
  onBack,
}: Props) {
  const { t } = useI18n()
  const [assignments, setAssignments] = useState<PreparedRoleAssignment[]>(() =>
    buildPreparedAssignments(selectedRoles),
  )
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const scriptRoleIds = getRoleIdsForScript(scriptId)
  const townsfolkRoles = getAllRoles().filter(
    (role) => role.team === 'townsfolk' && scriptRoleIds.includes(role.id),
  )

  const lockedCount = assignments.filter((assignment) => assignment.locked).length
  const allLocked = lockedCount === assignments.length
  const pendingDrunkIndex = assignments.findIndex(
    (assignment) =>
      assignment.autoSetup.kind === 'drunk' &&
      assignment.autoSetup.believedRoleId === null,
  )
  const pendingDrunkAssignment =
    pendingDrunkIndex >= 0 ? assignments[pendingDrunkIndex] : null
  const remainingDrunkChoices = townsfolkRoles.filter((role) => {
    return !assignments.some((assignment) => assignment.baseRoleId === role.id)
  })
  const activeIndex = assignments.findIndex(
    (assignment) => assignment.slotId === activeSlotId,
  )
  const activeAssignment = activeIndex >= 0 ? assignments[activeIndex] : null
  const activeRole = activeAssignment
    ? getRole(activeAssignment.displayRoleId)
    : null
  const activeTeam = activeRole ? getTeam(activeRole.team) : null

  const regenerateDeck = () => {
    setAssignments(buildPreparedAssignments(selectedRoles))
    setActiveSlotId(null)
    setNameDraft('')
  }

  const handleOpenSlot = (slotId: string) => {
    const assignment = assignments.find((item) => item.slotId === slotId)
    if (!assignment || assignment.locked) return

    setActiveSlotId(slotId)
    setNameDraft(assignment.playerName)
  }

  const handleCloseReveal = () => {
    setActiveSlotId(null)
    setNameDraft('')
  }

  const handleLockRole = () => {
    if (!activeAssignment) return
    const trimmedName = nameDraft.trim()
    if (!trimmedName) return

    const nextRevealOrder =
      assignments.reduce(
        (highest, assignment) =>
          Math.max(highest, assignment.revealOrder ?? 0),
        0,
      ) + 1

    setAssignments((current) =>
      current.map((assignment) =>
        assignment.slotId === activeAssignment.slotId
          ? {
              ...assignment,
              playerName: trimmedName,
              locked: true,
              revealOrder: nextRevealOrder,
            }
          : assignment,
      ),
    )
    setActiveSlotId(null)
    setNameDraft('')
  }

  const handleChooseDrunkRole = (roleId: string) => {
    if (!pendingDrunkAssignment) return

    setAssignments((current) =>
      current.map((assignment) =>
        assignment.slotId === pendingDrunkAssignment.slotId
          ? {
              ...assignment,
              displayRoleId: roleId as RoleId,
              autoSetup: {
                kind: 'drunk',
                believedRoleId: roleId as RoleId,
              },
            }
          : assignment,
      ),
    )
  }

  if (pendingDrunkAssignment) {
    const selectedRoleId =
      pendingDrunkAssignment.autoSetup.kind === 'drunk'
        ? pendingDrunkAssignment.autoSetup.believedRoleId
        : null

    return (
      <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
        <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
          <div className='flex items-center gap-3 max-w-lg mx-auto'>
            <BackButton onClick={onBack} />
            <div>
              <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
                {t.newGame.drunkSetupTitle}
              </h1>
              <p className='text-xs text-parchment-500'>
                {t.newGame.drunkSetupSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto'>
          <div className='rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 mb-4'>
            <div className='flex items-start gap-3'>
              <div className='w-10 h-10 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0'>
                <Icon name='beer' size='md' className='text-amber-400' />
              </div>
              <div>
                <p className='text-sm text-parchment-300 leading-relaxed'>
                  {t.newGame.drunkSetupDescription}
                </p>
                <p className='text-xs text-amber-300 mt-2'>
                  {t.common.player} {pendingDrunkIndex + 1}
                </p>
              </div>
            </div>
          </div>

          <h3 className='text-sm font-medium text-parchment-400 uppercase tracking-wider mb-3'>
            {t.newGame.chooseBelievedRole}
          </h3>

          <RolePickerGrid
            roles={remainingDrunkChoices}
            state={createInitialState()}
            selected={selectedRoleId ? [selectedRoleId] : []}
            onSelect={handleChooseDrunkRole}
            selectionCount={1}
            colorMode='team'
          />
        </div>
      </div>
    )
  }

  if (activeAssignment && activeRole && activeTeam) {
    return (
      <div className='min-h-app'>
        <TeamBackground teamId={activeRole.team}>
          <div className='w-full max-w-lg mx-auto px-4 pt-4 pb-6'>
            <div className='flex items-center justify-between mb-5'>
              <BackButton onClick={handleCloseReveal} />
              <div className='text-right'>
                <p className='text-xs uppercase tracking-[0.3em] text-parchment-400/70'>
                  {t.newGame.roleDrawTitle}
                </p>
                <p className='text-xs text-parchment-500'>
                  {activeIndex + 1} / {playerCount}
                </p>
              </div>
            </div>

            <p
              className={cn(
                'text-center text-sm uppercase tracking-widest font-semibold mb-5',
                activeTeam.isEvil ? 'text-red-300/80' : 'text-parchment-300/80',
              )}
            >
              {t.common.youAreThe}
            </p>

            <RoleCard roleId={activeAssignment.displayRoleId} />

            <div className='mt-6 rounded-2xl border border-white/15 bg-grimoire-dark/55 backdrop-blur-md p-4'>
              <label className='block text-xs uppercase tracking-[0.24em] text-parchment-500 mb-2'>
                {t.newGame.playerNameLabel}
              </label>
              <input
                autoFocus
                type='text'
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder={t.newGame.playerNamePlaceholder}
                className='w-full bg-white/5 border border-parchment-500/30 text-parchment-100 placeholder-parchment-500 rounded-xl px-4 py-3 focus:outline-none focus:border-mystic-gold/50 focus:ring-1 focus:ring-mystic-gold/30 transition-colors'
              />

              <div className='flex flex-col sm:flex-row gap-3 mt-4'>
                <Button
                  onClick={handleCloseReveal}
                  variant='secondary'
                  size='default'
                  fullWidth
                  className='sm:flex-1'
                >
                  {t.common.back}
                </Button>
                <Button
                  onClick={handleLockRole}
                  variant={activeTeam.isEvil ? 'evil' : 'gold'}
                  size='default'
                  fullWidth
                  className='sm:flex-1'
                  disabled={!nameDraft.trim()}
                >
                  <Icon name='check' size='sm' className='mr-1' />
                  {t.newGame.lockRoleAndName}
                </Button>
              </div>
            </div>
          </div>
        </TeamBackground>
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
                {t.newGame.step3Title}
              </h1>
              <p className='text-xs text-parchment-500'>
                {t.newGame.roleDrawSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className='px-4 py-3 bg-white/5 border-b border-white/10'>
        <div className='max-w-lg mx-auto flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Icon name='users' size='sm' className='text-mystic-gold/70' />
            <span className='text-sm text-parchment-300'>
              {lockedCount} / {playerCount} {t.newGame.rolesDealtLabel}
            </span>
          </div>
          <button
            type='button'
            onClick={regenerateDeck}
            disabled={lockedCount > 0}
            className='text-xs text-mystic-gold/80 hover:text-mystic-gold disabled:text-parchment-600 disabled:cursor-not-allowed flex items-center gap-1 transition-colors'
          >
            <Icon name='shuffle' size='xs' />
            {t.newGame.regenerateDeck}
          </button>
        </div>
      </div>

      <div className='flex-1 px-4 py-6 max-w-lg mx-auto w-full overflow-y-auto'>
        <div className='rounded-xl border border-mystic-gold/20 bg-mystic-gold/5 p-4 mb-5'>
          <p className='text-sm text-parchment-300 leading-relaxed'>
            {t.newGame.roleDrawHelp}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          {assignments.map((assignment, index) => {
            return (
              <button
                key={assignment.slotId}
                type='button'
                onClick={() => handleOpenSlot(assignment.slotId)}
                className={cn(
                  'rounded-2xl border p-4 text-left min-h-[132px] transition-all active:scale-[0.98]',
                  assignment.locked
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gradient-to-br from-mystic-gold/10 to-white/[0.03] border-mystic-gold/25 hover:border-mystic-gold/45',
                )}
              >
                <div className='flex items-center justify-between gap-3 mb-8'>
                  <span className='text-xs uppercase tracking-[0.24em] text-parchment-500'>
                    {t.common.player} {index + 1}
                  </span>
                  {assignment.locked ? (
                    <Icon
                      name='checkCircle'
                      size='sm'
                      className='text-emerald-500'
                    />
                  ) : (
                    <Icon
                      name='sparkles'
                      size='sm'
                      className='text-mystic-gold'
                    />
                  )}
                </div>

                {assignment.locked ? (
                  <div>
                    <div className='text-sm font-medium text-parchment-100 mb-1'>
                      {assignment.playerName}
                    </div>
                    <div className='text-xs text-parchment-500'>
                      {t.newGame.roleLockedLabel}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className='font-tarot text-base uppercase tracking-wider text-mystic-gold mb-1'>
                      {t.newGame.tapToRevealRole}
                    </div>
                    <div className='text-xs text-parchment-500'>
                      {t.newGame.roleDrawTitle}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <ScreenFooter>
        <Button
          onClick={() => onComplete(getAssignmentsInSeatingOrder(assignments))}
          disabled={!allLocked}
          fullWidth
          size='lg'
          variant='gold'
        >
          <Icon name='moon' size='md' className='mr-2' />
          {t.common.startGame}
        </Button>
      </ScreenFooter>
    </div>
  )
}
