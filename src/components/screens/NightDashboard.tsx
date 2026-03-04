import { useMemo, useState } from 'react'
import { Game, GameState, PlayerState, RichMessage } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { getTeam } from '../../lib/teams'
import {
  getNightRolesStatus,
  getNightActionSummary,
  NightRoleStatus,
} from '../../lib/game'
import { getAvailableNightFollowUps } from '../../lib/pipeline'
import { AvailableNightFollowUp } from '../../lib/pipeline/types'
import { useI18n, getRoleName } from '../../lib/i18n'
import { Button, Icon } from '../atoms'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '../atoms'
import { RichMessage as RichMessageDisplay } from '../items/RichMessage'
import { Grimoire } from '../items/Grimoire'
import { MysticDivider, StorytellerGrimoireBoard } from '../items'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'

// ============================================================================
// UNIFIED NIGHT DASHBOARD ITEM
// ============================================================================

type NightDashboardItem =
  | { type: 'night_action'; data: NightRoleStatus }
  | { type: 'night_follow_up'; data: AvailableNightFollowUp }

export function mergeNightDashboardItems(
  nightActions: NightRoleStatus[],
  followUps: AvailableNightFollowUp[],
): NightDashboardItem[] {
  const items: NightDashboardItem[] = nightActions.map((data) => ({
    type: 'night_action' as const,
    data,
  }))

  const trailingFollowUps: AvailableNightFollowUp[] = []

  for (const followUp of followUps) {
    if (followUp.placement === 'before_player_action') {
      const insertIndex = items.findIndex(
        (item) =>
          item.type === 'night_action' &&
          item.data.status === 'pending' &&
          item.data.playerId === followUp.playerId,
      )

      if (insertIndex !== -1) {
        items.splice(insertIndex, 0, {
          type: 'night_follow_up',
          data: followUp,
        })
        continue
      }
    }

    trailingFollowUps.push(followUp)
  }

  for (const followUp of trailingFollowUps) {
    items.push({ type: 'night_follow_up', data: followUp })
  }

  return items
}

// ============================================================================
// COMPONENT
// ============================================================================

type Props = {
  game: Game
  state: GameState
  onOpenNightAction: (
    playerId: string,
    roleId: string,
    systemStepId?: NightRoleStatus['systemStepId'],
  ) => void
  onReplayNightAction: (
    playerId: string,
    roleId: string,
    systemStepId?: NightRoleStatus['systemStepId'],
  ) => void
  onRerunSkippedNightAction: (
    playerId: string,
    roleId: string,
    systemStepId?: NightRoleStatus['systemStepId'],
  ) => void
  onSkipNightAction: (
    playerId: string,
    roleId: string,
    systemStepId?: NightRoleStatus['systemStepId'],
  ) => void
  onOpenNightFollowUp: (followUp: AvailableNightFollowUp) => void
  onStartDay: () => void
  onMainMenu: () => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
  onOpenGrimoirePlayer?: (player: PlayerState) => void
}

export function NightDashboard({
  game,
  state,
  onOpenNightAction,
  onReplayNightAction,
  onRerunSkippedNightAction,
  onSkipNightAction,
  onOpenNightFollowUp,
  onStartDay,
  onMainMenu,
  onShowRoleCard,
  onEditEffects,
  onOpenGrimoirePlayer,
}: Props) {
  const { t } = useI18n()
  const [grimoireExpanded, setGrimoireExpanded] = useState(false)
  const [grimoireView, setGrimoireView] = useState<'circle' | 'list'>('circle')
  const [reviewRoleStatus, setReviewRoleStatus] = useState<NightRoleStatus | null>(null)

  // Collect night actions and follow-ups separately, then merge
  const items: NightDashboardItem[] = useMemo(() => {
    const nightActions = getNightRolesStatus(game)
    const followUps = getAvailableNightFollowUps(state, game, t)
    return mergeNightDashboardItems(nightActions, followUps)
  }, [game, state, t])

  // Derive next pending item and allDone from the unified list
  const nextPendingIndex = items.findIndex((item) => {
    if (item.type === 'night_action') return item.data.status === 'pending'
  // Follow-ups are always pending (they disappear when completed)
    return true
  })
  const allDone = nextPendingIndex === -1

  const reviewMessages: RichMessage[] = useMemo(() => {
    if (!reviewRoleStatus || reviewRoleStatus.status !== 'done') return []
    return getNightActionSummary(
      game,
      reviewRoleStatus.playerId,
      reviewRoleStatus.roleId,
      reviewRoleStatus.systemStepId,
    )
  }, [game, reviewRoleStatus])

  const reviewRole = reviewRoleStatus
    ? getRole(reviewRoleStatus.roleId)
    : null
  const reviewSkippedReason =
    reviewRoleStatus?.skippedReasonCode === 'evil_info_under_seven'
      ? reviewRoleStatus.dashboardKind === 'demon_info'
        ? t.game.demonInfoSkippedUnderSeven
        : t.game.minionInfoSkippedUnderSeven
      : null

  return (
    <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='bg-gradient-to-b from-indigo-900/50 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          {/* Menu button row */}
          <div className='flex items-center mb-4'>
            <button
              onClick={onMainMenu}
              className='p-3 -ml-3 text-parchment-500 hover:text-parchment-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center'
            >
              <Icon name='menu' size='md' />
            </button>
          </div>

          {/* Title section */}
          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name='moon' size='3xl' className='text-indigo-400' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {t.game.night} {state.round}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {t.game.nightDashboardDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        {/* Night Actions List */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-3 px-1'>
            <Icon name='moon' size='sm' className='text-indigo-400' />
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase'>
              {t.game.nightDashboard}
            </span>
          </div>
          <div className='space-y-2'>
            {items.map((item, index) =>
              item.type === 'night_action' ? (
                <NightActionRow
                  key={`action-${item.data.playerId}-${item.data.roleId}-${item.data.systemStepId ?? 'role'}`}
                  roleStatus={item.data}
                  index={index + 1}
                  isNext={index === nextPendingIndex}
                  onOpen={() =>
                    onOpenNightAction(
                      item.data.playerId,
                      item.data.roleId,
                      item.data.systemStepId,
                    )
                  }
                  onSkip={() =>
                    onSkipNightAction(
                      item.data.playerId,
                      item.data.roleId,
                      item.data.systemStepId,
                    )
                  }
                  onReview={() => setReviewRoleStatus(item.data)}
                />
              ) : (
                <NightFollowUpRow
                  key={`followup-${item.data.id}`}
                  followUp={item.data}
                  index={index + 1}
                  isNext={index === nextPendingIndex}
                  onOpen={() => onOpenNightFollowUp(item.data)}
                />
              ),
            )}
          </div>

          {allDone && items.length > 0 && (
            <div className='mt-4 text-center'>
              <p className='text-emerald-400 text-sm flex items-center justify-center gap-2'>
                <Icon name='checkCircle' size='sm' />
                {t.game.allActionsComplete}
              </p>
            </div>
          )}
        </div>

        <MysticDivider className='mb-6' />

        {/* Grimoire Section (collapsible, default collapsed) */}
        <div className='mb-6'>
          <button
            onClick={() => setGrimoireExpanded(!grimoireExpanded)}
            className='w-full flex items-center gap-2 mb-2 px-1 group'
          >
            <Icon name='scrollText' size='sm' className='text-mystic-gold' />
            <span className='font-tarot text-sm text-parchment-100 tracking-wider uppercase flex-1 text-left'>
              {t.game.grimoire}
            </span>
            <Icon
              name={grimoireExpanded ? 'chevronUp' : 'chevronDown'}
              size='sm'
              className={cn(
                'transition-colors',
                grimoireExpanded
                  ? 'text-parchment-400'
                  : 'text-parchment-500 group-hover:text-parchment-300',
              )}
            />
          </button>
          {grimoireExpanded && (
            <div className='bg-white/5 rounded-xl border border-white/10 overflow-hidden'>
              <div className='flex gap-2 p-3 border-b border-white/10 bg-black/10'>
                <button
                  onClick={() => setGrimoireView('circle')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors',
                    grimoireView === 'circle'
                      ? 'border-mystic-gold/35 bg-mystic-gold/10 text-mystic-gold'
                      : 'border-white/10 text-parchment-500 hover:border-white/20 hover:text-parchment-300',
                  )}
                >
                  {t.game.grimoireViewCircle}
                </button>
                <button
                  onClick={() => setGrimoireView('list')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors',
                    grimoireView === 'list'
                      ? 'border-mystic-gold/35 bg-mystic-gold/10 text-mystic-gold'
                      : 'border-white/10 text-parchment-500 hover:border-white/20 hover:text-parchment-300',
                  )}
                >
                  {t.game.grimoireViewList}
                </button>
              </div>
              {grimoireView === 'circle' ? (
                <div className='p-3'>
                  <StorytellerGrimoireBoard
                    state={state}
                    onPlayerSelect={onOpenGrimoirePlayer}
                  />
                </div>
              ) : (
                <Grimoire
                  state={state}
                  compact
                  onPlayerSelect={onOpenGrimoirePlayer}
                  onShowRoleCard={onShowRoleCard}
                  onEditEffects={onEditEffects}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button
          onClick={onStartDay}
          disabled={!allDone}
          fullWidth
          size='lg'
          variant='ember'
        >
          <Icon name='sun' size='md' className='mr-2' />
          {t.game.proceedToDay}
        </Button>
      </ScreenFooter>

      <Dialog
        open={reviewRoleStatus !== null}
        onOpenChange={(open) => {
          if (!open) setReviewRoleStatus(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.game.actionSummary}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {reviewRoleStatus && (
              <>
                <p className='text-parchment-300 text-sm mb-3 font-medium'>
                  {reviewRoleStatus.playerName}
                </p>
                {reviewRoleStatus.status === 'skipped' ? (
                  <div className='space-y-3'>
                    {reviewRoleStatus.malfunctioning && (
                      <div className='flex items-start gap-2 text-amber-300 text-sm bg-amber-900/20 border border-amber-500/25 rounded-lg p-3'>
                        <Icon name='flask' size='sm' className='mt-0.5 flex-shrink-0' />
                        {t.game.playerIsMalfunctioning}
                      </div>
                    )}
                    <div className='flex items-center gap-2 text-parchment-400 text-sm bg-white/5 rounded-lg p-3'>
                      <Icon name='zapOff' size='sm' />
                      {t.game.actionSkipped}
                    </div>
                    {reviewSkippedReason && (
                      <div className='flex items-start gap-2 text-parchment-300 text-sm bg-white/5 rounded-lg p-3'>
                        <Icon name='scrollText' size='sm' className='mt-0.5 flex-shrink-0' />
                        {reviewSkippedReason}
                      </div>
                    )}
                    <div className='flex items-start gap-2 text-amber-300 text-sm bg-amber-900/20 border border-amber-500/25 rounded-lg p-3'>
                      <Icon name='alertTriangle' size='sm' className='mt-0.5 flex-shrink-0' />
                      {t.game.rerunSkippedActionWarning}
                    </div>
                    {!reviewRoleStatus.systemStepId && reviewRole?.NightAction && (
                      <Button
                        fullWidth
                        variant='secondary'
                        onClick={() => {
                          onRerunSkippedNightAction(
                            reviewRoleStatus.playerId,
                            reviewRoleStatus.roleId,
                            reviewRoleStatus.systemStepId,
                          )
                          setReviewRoleStatus(null)
                        }}
                      >
                        <Icon name='play' size='sm' className='mr-2' />
                        {t.game.rerunSkippedAction}
                      </Button>
                    )}
                  </div>
                ) : reviewMessages.length === 0 ? (
                  <div className='space-y-3'>
                    {reviewRoleStatus.malfunctioning && (
                      <div className='flex items-start gap-2 text-amber-300 text-sm bg-amber-900/20 border border-amber-500/25 rounded-lg p-3'>
                        <Icon name='flask' size='sm' className='mt-0.5 flex-shrink-0' />
                        {t.game.playerIsMalfunctioning}
                      </div>
                    )}
                    <p className='text-parchment-500 text-sm'>
                      {t.game.noActionRecorded}
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {reviewRoleStatus.malfunctioning && (
                      <div className='flex items-start gap-2 text-amber-300 text-sm bg-amber-900/20 border border-amber-500/25 rounded-lg p-3'>
                        <Icon name='flask' size='sm' className='mt-0.5 flex-shrink-0' />
                        {t.game.playerIsMalfunctioning}
                      </div>
                    )}
                    <div className='space-y-2'>
                      {reviewMessages.map((msg, i) => (
                        <div
                          key={i}
                          className='text-parchment-300 text-sm bg-white/5 rounded-lg p-3'
                        >
                          <RichMessageDisplay message={msg} state={state} />
                        </div>
                      ))}
                    </div>
                    <Button
                      fullWidth
                      variant='secondary'
                      onClick={() => {
                        onReplayNightAction(
                          reviewRoleStatus.playerId,
                          reviewRoleStatus.roleId,
                          reviewRoleStatus.systemStepId,
                        )
                        setReviewRoleStatus(null)
                      }}
                    >
                      <Icon name='play' size='sm' className='mr-2' />
                      {t.game.showActionAgain}
                    </Button>
                  </div>
                )}
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// NIGHT ACTION ROW (regular night actions from roles)
// ============================================================================

function NightActionRow({
  roleStatus,
  index,
  isNext,
  onOpen,
  onSkip,
  onReview,
}: {
  roleStatus: NightRoleStatus
  index: number
  isNext: boolean
  onOpen: () => void
  onSkip: () => void
  onReview: () => void
}) {
  const { language, t } = useI18n()
  const role = getRole(roleStatus.roleId)
  const team = role ? getTeam(role.team) : null

  const roleName = useMemo(() => {
    if (roleStatus.dashboardKind === 'minion_info') {
      return t.game.minionInfo
    }
    if (roleStatus.dashboardKind === 'demon_info') {
      return t.game.demonInfo
    }
    if (roleStatus.dashboardKind === 'demon_bluffs') {
      return t.game.stepShowBluffs
    }
    return getRoleName(roleStatus.roleId, language)
  }, [
    roleStatus.dashboardKind,
    roleStatus.roleId,
    language,
    t.game.minionInfo,
    t.game.demonInfo,
    t.game.stepShowBluffs,
  ])

  const rowIcon =
    roleStatus.dashboardKind === 'minion_info'
      ? 'swords'
      : roleStatus.dashboardKind === 'demon_info'
        ? 'users'
        : roleStatus.dashboardKind === 'demon_bluffs'
          ? 'eye'
          : (role?.icon ?? 'user')

  const isDone = roleStatus.status === 'done'
  const isSkipped = roleStatus.status === 'skipped'

  return (
    <DashboardRow
      index={index}
      isNext={isNext}
      isDone={isDone}
      isSkipped={isSkipped}
      icon={rowIcon}
      label={roleName}
      sublabel={roleStatus.playerName}
      malfunctioning={roleStatus.malfunctioning}
      isEvil={team?.isEvil}
      onOpen={onOpen}
      onSkip={onSkip}
      onReview={onReview}
    />
  )
}

// ============================================================================
// NIGHT FOLLOW-UP ROW (reactive follow-ups from effects)
// ============================================================================

function NightFollowUpRow({
  followUp,
  index,
  isNext,
  onOpen,
}: {
  followUp: AvailableNightFollowUp
  index: number
  isNext: boolean
  onOpen: () => void
}) {
  return (
    <DashboardRow
      index={index}
      isNext={isNext}
      isDone={false}
      icon={followUp.icon}
      label={followUp.label}
      sublabel={followUp.playerName}
      isFollowUp
      onOpen={onOpen}
    />
  )
}

// ============================================================================
// SHARED ROW COMPONENT
// ============================================================================

function DashboardRow({
  index,
  isNext,
  isDone,
  isSkipped,
  icon,
  label,
  sublabel,
  malfunctioning,
  isEvil,
  isFollowUp,
  onOpen,
  onSkip,
  onReview,
}: {
  index: number
  isNext: boolean
  isDone: boolean
  isSkipped?: boolean
  icon: string
  label: string
  sublabel: string
  malfunctioning?: boolean
  isEvil?: boolean
  isFollowUp?: boolean
  onOpen: () => void
  onSkip?: () => void
  onReview?: () => void
}) {
  const { t } = useI18n()

  const isClickable = isNext || isDone || Boolean(isSkipped)
  const handleClick = () => {
    if (isNext) {
      onOpen()
    } else if ((isDone || isSkipped) && onReview) {
      onReview()
    }
  }

  const getStatusBadge = () => {
    if (isDone) {
      return (
        <span className='flex items-center gap-1 text-xs text-emerald-400'>
          <Icon name='checkCircle' size='sm' />
          {t.game.actionDone}
        </span>
      )
    }
    if (isSkipped) {
      return (
        <span className='flex items-center gap-1 text-xs text-parchment-500'>
          <Icon name='zapOff' size='sm' />
          {t.game.actionSkipped}
        </span>
      )
    }
    if (isNext) {
      return (
        <span className='flex items-center gap-1 text-xs text-indigo-300'>
          <Icon name='arrowRight' size='sm' />
          {t.game.nextAction}
        </span>
      )
    }
    return (
      <span className='flex items-center gap-1 text-xs text-parchment-600'>
        {t.game.actionPending}
      </span>
    )
  }

  return (
    <button
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        isNext
          ? isFollowUp
            ? 'bg-purple-900/30 border border-purple-500/40 hover:bg-purple-900/50 cursor-pointer'
            : 'bg-indigo-900/30 border border-indigo-500/40 hover:bg-indigo-900/50 cursor-pointer'
          : isDone
            ? 'bg-white/3 opacity-70 hover:opacity-90 cursor-pointer'
            : isSkipped
              ? 'bg-white/3 opacity-60'
            : 'bg-white/2 opacity-50',
      )}
    >
      {/* Order number */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
          isNext
            ? isFollowUp
              ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
              : 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
            : isDone
              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
              : isSkipped
                ? 'bg-parchment-500/10 text-parchment-500 border border-parchment-500/20'
              : 'bg-white/5 text-parchment-600 border border-white/10',
        )}
      >
        {isDone ? <Icon name='check' size='xs' /> : isSkipped ? <Icon name='zapOff' size='xs' /> : index}
      </div>

      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
          isNext
            ? isFollowUp
              ? 'bg-purple-500/20 border-purple-400/30'
              : isEvil
                ? 'bg-red-900/30 border-red-600/30'
                : 'bg-indigo-500/20 border-indigo-400/30'
            : isDone
              ? 'bg-parchment-500/10 border-parchment-500/20'
              : isSkipped
                ? 'bg-parchment-500/8 border-parchment-500/15'
              : 'bg-white/5 border-white/10',
        )}
      >
        <Icon
          name={icon as any}
          size='md'
          className={cn(
            isNext
              ? isFollowUp
                ? 'text-purple-300'
                : isEvil
                  ? 'text-red-400'
                  : 'text-indigo-300'
              : isSkipped
                ? 'text-parchment-500'
              : 'text-parchment-500',
          )}
        />
      </div>

      {/* Label & Sublabel */}
      <div className='flex-1 min-w-0'>
        <div
          className={cn(
            'font-medium text-sm',
            isNext
              ? 'text-parchment-100'
              : isDone
                ? 'text-parchment-400'
                : isSkipped
                  ? 'text-parchment-500'
                : 'text-parchment-600',
          )}
        >
          {label}
        </div>
        <span
          className={cn(
            'text-xs',
            isNext
              ? isFollowUp
                ? 'text-purple-400/80'
                : 'text-indigo-400/80'
              : isSkipped
                ? 'text-parchment-500'
              : 'text-parchment-600',
          )}
        >
          {sublabel}
        </span>
      </div>

      {/* Status Badge / Skip */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        {malfunctioning && (
          <div
            className='w-7 h-7 rounded-full border border-amber-500/30 bg-amber-900/20 text-amber-300 flex items-center justify-center'
            title={t.game.malfunctionWarning}
            aria-label={t.game.malfunctionWarning}
          >
            <Icon name='flask' size='xs' />
          </div>
        )}
        {isNext && !isDone && !isFollowUp && onSkip && (
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation()
              onSkip()
            }}
            className='w-9 h-9 rounded-full border border-amber-500/35 bg-amber-900/20 text-amber-300 flex items-center justify-center hover:bg-amber-900/35 hover:border-amber-400/50 transition-colors'
            title={t.game.skipNightAction}
            aria-label={t.game.skipNightAction}
          >
            <Icon name='zapOff' size='sm' />
          </button>
        )}
        {getStatusBadge()}
      </div>
    </button>
  )
}
