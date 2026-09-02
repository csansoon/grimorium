import { useMemo, useState } from 'react'
import { getRole } from '../../lib/roles'
import { getRoleTeamId } from '../../lib/identity'
import type { RoleId } from '../../lib/roles/types'
import { getRoleIdsForScript, type ScriptId } from '../../lib/scripts'
import { getTeam } from '../../lib/teams'
import { useI18n, getRoleName, interpolate } from '../../lib/i18n'
import {
  BackButton,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Icon,
} from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'
import type { PreparedRoleAssignment } from './RoleDeal'

type PreparedAutoSetup =
  | { kind: 'none' }
  | { kind: 'drunk'; believedRoleId: RoleId | null }

type SeatAssignment = {
  slotId: string
  seatNumber: number
  playerName: string
  roleId: RoleId | null
  autoSetup: PreparedAutoSetup
}

type Props = {
  playerCount: number
  scriptId: ScriptId
  selectedRoles: string[]
  onComplete: (assignments: PreparedRoleAssignment[]) => void
  onBack: () => void
}

function buildSeatAssignments(playerCount: number): SeatAssignment[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    slotId: `seat-${index + 1}`,
    seatNumber: index + 1,
    playerName: '',
    roleId: null,
    autoSetup: { kind: 'none' },
  }))
}

export function ManualGrimoireAssignment({
  playerCount,
  scriptId,
  selectedRoles,
  onComplete,
  onBack,
}: Props) {
  const { t, language } = useI18n()
  const [seats, setSeats] = useState<SeatAssignment[]>(() =>
    buildSeatAssignments(playerCount),
  )
  const [selectedSeatId, setSelectedSeatId] = useState<string>('seat-1')
  const [isSeatSheetOpen, setIsSeatSheetOpen] = useState(false)

  const selectedSeat = seats.find((seat) => seat.slotId === selectedSeatId) ?? null
  const scriptRoleIds = getRoleIdsForScript(scriptId)

  const rolePool = useMemo(() => {
    const pool: Record<string, number> = {}
    for (const roleId of selectedRoles) {
      pool[roleId] = (pool[roleId] ?? 0) + 1
    }
    return pool
  }, [selectedRoles])

  const assignedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const seat of seats) {
      if (!seat.roleId) continue
      counts[seat.roleId] = (counts[seat.roleId] ?? 0) + 1
    }
    return counts
  }, [seats])

  const availableRolesForSeat = useMemo(() => {
    if (!selectedSeat) return []

    return Object.entries(rolePool)
      .filter(([roleId, total]) => {
        const assigned = assignedCounts[roleId] ?? 0
        return assigned < total || selectedSeat.roleId === roleId
      })
      .map(([roleId]) => roleId as RoleId)
  }, [assignedCounts, rolePool, selectedSeat])

  const remainingRoles = useMemo(() => {
    const result: RoleId[] = []
    for (const [roleId, total] of Object.entries(rolePool)) {
      const remaining = total - (assignedCounts[roleId] ?? 0)
      for (let i = 0; i < remaining; i++) {
        result.push(roleId as RoleId)
      }
    }
    return result
  }, [assignedCounts, rolePool])

  const drunkBelievedRoleChoices = useMemo(() => {
    return scriptRoleIds.filter((roleId) => {
      const role = getRole(roleId)
      return getRoleTeamId(role) === 'townsfolk' && !selectedRoles.includes(roleId)
    })
  }, [scriptRoleIds, selectedRoles])

  const assignedSeatCount = seats.filter((seat) => seat.roleId).length
  const namedSeatCount = seats.filter((seat) => seat.playerName.trim()).length
  const allRolesAssigned = seats.every((seat) => seat.roleId)
  const allNamesAssigned = seats.every((seat) => seat.playerName.trim())
  const allDrunksConfigured = seats.every((seat) => {
    if (seat.autoSetup.kind !== 'drunk') return true
    return Boolean(seat.autoSetup.believedRoleId)
  })
  const canStart = allRolesAssigned && allNamesAssigned && allDrunksConfigured

  const seatPositions = useMemo(() => {
    return seats.map((seat, index) => {
      const angle = -Math.PI / 2 + (index / seats.length) * Math.PI * 2
      const radius = seats.length >= 13 ? 41 : seats.length >= 10 ? 42 : 43
      return {
        seat,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      }
    })
  }, [seats])

  const boardAspectClass =
    seats.length > 11
      ? 'aspect-[7/10]'
      : seats.length > 8
        ? 'aspect-[3/4]'
        : 'aspect-[4/5]'

  const updateSeat = (seatId: string, patch: Partial<SeatAssignment>) => {
    setSeats((current) =>
      current.map((seat) => (seat.slotId === seatId ? { ...seat, ...patch } : seat)),
    )
  }

  const handleRoleSelect = (roleId: RoleId) => {
    if (!selectedSeat) return

    updateSeat(selectedSeat.slotId, {
      roleId,
      autoSetup:
        roleId === 'drunk'
          ? { kind: 'drunk', believedRoleId: null }
          : { kind: 'none' },
    })
  }

  const handleStart = () => {
    if (!canStart) return

    const preparedAssignments: PreparedRoleAssignment[] = seats.map((seat) => {
      const roleId = seat.roleId as RoleId
      return {
        slotId: seat.slotId,
        baseRoleId: roleId,
        displayRoleId:
          seat.autoSetup.kind === 'drunk' && seat.autoSetup.believedRoleId
            ? seat.autoSetup.believedRoleId
            : roleId,
        playerName: seat.playerName.trim(),
        locked: true,
        revealOrder: seat.seatNumber,
        autoSetup: seat.autoSetup,
      }
    })

    onComplete(preparedAssignments)
  }

  const handleSeatOpen = (seatId: string) => {
    setSelectedSeatId(seatId)
    setIsSeatSheetOpen(true)
  }

  return (
    <Dialog open={isSeatSheetOpen} onOpenChange={setIsSeatSheetOpen}>
      <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
        <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
          <div className='flex items-center gap-3 max-w-lg mx-auto'>
            <BackButton onClick={onBack} />
            <div className='flex-1'>
              <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
                {t.newGame.step3Title}
              </h1>
              <p className='text-xs text-parchment-500'>
                {t.newGame.step3GrimoireSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className='px-4 py-3 bg-white/5 border-b border-white/10'>
          <div className='max-w-lg mx-auto flex items-center justify-between gap-3 text-sm'>
            <div className='flex items-center gap-2 text-parchment-300'>
              <Icon name='users' size='sm' className='text-mystic-gold/70' />
              <span>{assignedSeatCount} / {playerCount} {t.common.roles.toLowerCase()}</span>
            </div>
            <div className='text-parchment-500'>
              {namedSeatCount} / {playerCount} {t.common.players.toLowerCase()}
            </div>
          </div>
        </div>

        <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-4'>
          <div className='rounded-xl border border-mystic-gold/20 bg-mystic-gold/5 p-4'>
            <p className='text-sm text-parchment-300 leading-relaxed'>
              {t.newGame.grimoireAssignmentHelp}
            </p>
          </div>

          <section className='rounded-2xl border border-mystic-gold/20 bg-white/[0.03] backdrop-blur-sm p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <Icon name='users' size='sm' className='text-mystic-gold' />
              <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
                {t.game.grimoireCircle}
              </h2>
            </div>

            <div className={cn('relative w-full max-w-[26rem] mx-auto', boardAspectClass)}>
              <div className='absolute inset-[11%] rounded-full border border-mystic-gold/20 bg-mystic-gold/5 shadow-[inset_0_0_40px_rgba(255,196,87,0.05)]' />
              <div className='absolute inset-[20%] rounded-full border border-white/8' />
              <div className='absolute inset-[33%] rounded-full border border-mystic-gold/10' />

              {seatPositions.map(({ seat, x, y }) => {
                const isSelected = seat.slotId === selectedSeatId
                const role = seat.roleId ? getRole(seat.roleId) : null
                const teamId = role ? getRoleTeamId(role) : null
                const team = teamId ? getTeam(teamId) : null

                return (
                  <button
                    key={seat.slotId}
                    type='button'
                    onClick={() => handleSeatOpen(seat.slotId)}
                    className='absolute -translate-x-1/2 -translate-y-1/2 w-[5.35rem]'
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div
                      className={cn(
                        'relative flex flex-col items-center rounded-2xl px-1 py-1.5 transition-all',
                        isSelected &&
                          'bg-mystic-gold/8 shadow-[0_0_0_1px_rgba(255,196,87,0.25),0_0_16px_rgba(255,196,87,0.15)]',
                      )}
                    >
                      <div className='relative w-[4.8rem] h-[4.8rem] rounded-full overflow-visible'>
                        <div className='absolute inset-0 rounded-full border border-white/10 bg-black/20' />
                        <div
                          className={cn(
                            'absolute inset-[6px] rounded-full border',
                            role ? team?.colors.cardSealRing : 'border-parchment-500/20',
                          )}
                        />
                        <div
                          className={cn(
                            'absolute inset-[11px] rounded-full flex items-center justify-center border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                            role
                              ? team?.colors.cardIconBg
                              : 'bg-parchment-500/10 border-parchment-500/20',
                          )}
                        >
                          <Icon
                            name={role?.icon ?? 'user'}
                            size='xl'
                            className={role ? team?.colors.cardWinAccent : 'text-parchment-500'}
                          />
                        </div>
                      </div>

                      <div className='mt-1 text-[10px] leading-tight text-center text-parchment-100 max-w-[5rem]'>
                        <div
                          className={cn(
                            'font-medium uppercase tracking-[0.12em] text-[9px] truncate',
                            role ? 'text-mystic-gold' : 'text-parchment-500',
                          )}
                        >
                          {role
                            ? getRoleName(role.id, language)
                            : interpolate(t.game.grimoireSeat, { seat: seat.seatNumber })}
                        </div>
                        <div className='mt-0.5 truncate text-parchment-300'>
                          {seat.playerName.trim() || t.newGame.playerNamePlaceholder}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className='rounded-2xl border border-white/10 bg-white/5 p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <Icon name='scrollText' size='sm' className='text-mystic-gold' />
              <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
                {t.newGame.randomPool}
              </h2>
            </div>

            {remainingRoles.length > 0 ? (
              <div className='flex flex-wrap gap-1.5'>
                {remainingRoles.map((roleId, index) => {
                  const role = getRole(roleId)
                  return (
                    <Badge
                      key={`${roleId}-${index}`}
                      variant={role ? (getRoleTeamId(role) ?? 'townsfolk') : 'townsfolk'}
                      className='inline-flex items-center gap-1'
                    >
                      {role && <Icon name={role.icon} size='xs' />}
                      {getRoleName(roleId, language)}
                    </Badge>
                  )
                })}
              </div>
            ) : (
              <p className='text-sm text-parchment-400'>
                {t.newGame.allRolesPlaced}
              </p>
            )}
          </section>
        </div>

        <ScreenFooter>
          {!allNamesAssigned && (
            <p className='mb-2 text-center text-xs text-parchment-500'>
              {t.newGame.allSeatsNeedNames}
            </p>
          )}
          {allNamesAssigned && !allRolesAssigned && (
            <p className='mb-2 text-center text-xs text-parchment-500'>
              {t.newGame.allSeatsNeedRoles}
            </p>
          )}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            fullWidth
            size='lg'
            variant='gold'
          >
            <Icon name='play' size='md' className='mr-2' />
            {t.common.startGame}
          </Button>
        </ScreenFooter>
      </div>

      <DialogContent className='max-h-[92vh]'>
        {selectedSeat && (
          <>
            <DialogHeader>
              <DialogTitle>
                {interpolate(t.game.grimoireSeat, { seat: selectedSeat.seatNumber })}
              </DialogTitle>
              <DialogDescription className='mt-2'>
                {selectedSeat.roleId
                  ? getRoleName(selectedSeat.roleId, language)
                  : t.newGame.chooseRoleForSeat}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className='space-y-5'>
              <div>
                <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
                  {t.newGame.chooseRoleForSeat}
                </label>
                <div className='flex flex-wrap gap-2'>
                  {availableRolesForSeat.map((roleId) => {
                    const role = getRole(roleId)
                    if (!role) return null
                    const team = getTeam(getRoleTeamId(role) ?? 'townsfolk')
                    const isSelectedRole = selectedSeat.roleId === roleId

                    return (
                      <button
                        key={roleId}
                        type='button'
                        onClick={() => handleRoleSelect(roleId)}
                        className={cn(
                          'inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          isSelectedRole
                            ? cn(
                                team.colors.badge,
                                team.colors.badgeText,
                                'ring-1 ring-white/20',
                              )
                            : cn(
                                'bg-white/5 border-white/15 hover:bg-white/10',
                                team.colors.text,
                              ),
                        )}
                      >
                        <Icon
                          name={role.icon}
                          size='xs'
                        />
                        {getRoleName(roleId, language)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
                  {t.newGame.playerNameLabel}
                </label>
                <input
                  type='text'
                  value={selectedSeat.playerName}
                  onChange={(event) =>
                    updateSeat(selectedSeat.slotId, { playerName: event.target.value })
                  }
                  placeholder={t.newGame.playerNamePlaceholder}
                  className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
                />
              </div>

              {selectedSeat.autoSetup.kind === 'drunk' && (
                <div>
                  <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
                    {t.newGame.chooseBelievedRole}
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {drunkBelievedRoleChoices.map((roleId) => {
                      const role = getRole(roleId)
                      if (!role) return null
                      const isSelectedBelief =
                        selectedSeat.autoSetup.kind === 'drunk' &&
                        selectedSeat.autoSetup.believedRoleId === roleId

                      return (
                        <button
                          key={roleId}
                          type='button'
                          onClick={() =>
                            updateSeat(selectedSeat.slotId, {
                              autoSetup: {
                                kind: 'drunk',
                                believedRoleId: roleId,
                              },
                            })
                          }
                          className={cn(
                            'inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            isSelectedBelief
                              ? 'bg-mystic-gold/20 border-mystic-gold/40 text-mystic-gold'
                              : 'bg-white/5 border-white/15 text-parchment-300 hover:bg-white/10',
                          )}
                        >
                          <Icon name={role.icon} size='xs' />
                          {getRoleName(roleId, language)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
