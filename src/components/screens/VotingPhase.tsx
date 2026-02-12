import { useMemo, useState } from 'react'
import { GameState, PlayerState, hasEffect } from '../../lib/types'
import { getEffect } from '../../lib/effects'
import { useI18n, interpolate, getRoleTranslations } from '../../lib/i18n'
import { Button, Icon, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'

type Props = {
  state: GameState
  nomineeId: string
  onVoteComplete: (
    votesForCount: number,
    votesAgainstCount: number,
    votesForIds?: string[],
    votesAgainstIds?: string[],
  ) => void
  onCancel: () => void
}

type VoteValue = 'for' | 'against' | 'abstain' | null
type VoteMode = 'quick' | 'detailed'

/**
 * Get the Butler's master player name, if this player has the butler_master effect.
 * Returns null if the player is not the Butler or has no master assigned.
 */
function getButlerMasterName(
  player: PlayerState,
  state: GameState,
): string | null {
  const butlerEffect = player.effects.find((e) => e.type === 'butler_master')
  if (!butlerEffect?.data?.masterId) return null
  const master = state.players.find(
    (p) => p.id === butlerEffect.data!.masterId,
  )
  return master?.name ?? null
}

export function VotingPhase({
  state,
  nomineeId,
  onVoteComplete,
  onCancel,
}: Props) {
  const { t, language } = useI18n()
  const butlerT = getRoleTranslations('butler', language)
  const nominee = state.players.find((p) => p.id === nomineeId)
  const [mode, setMode] = useState<VoteMode>('quick')

  const canPlayerVote = (player: PlayerState): boolean => {
    // Check all effects for voting restrictions
    for (const effect of player.effects) {
      const def = getEffect(effect.type)
      if (!def) continue
      if (def.preventsVoting) {
        // If the effect has a canVote function, defer to it (e.g., dead players get one vote)
        if (def.canVote) {
          return def.canVote(player, state)
        }
        return false
      }
    }
    return true
  }

  const eligibleVoters = useMemo(
    () => state.players.filter((p) => p.id !== nomineeId && canPlayerVote(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.players, nomineeId],
  )

  const totalEligible = eligibleVoters.length

  // ========================================================================
  // DETAILED MODE STATE
  // ========================================================================

  const initialVotes = useMemo(() => {
    const init: Record<string, VoteValue> = {}
    for (const voter of eligibleVoters) {
      init[voter.id] = 'abstain'
    }
    return init
  }, [eligibleVoters])

  const [votes, setVotes] = useState<Record<string, VoteValue>>(initialVotes)

  const handleVote = (playerId: string, vote: VoteValue) => {
    setVotes({ ...votes, [playerId]: vote })
  }

  const detailedForCount = Object.values(votes).filter(
    (v) => v === 'for',
  ).length
  const detailedAgainstCount = Object.values(votes).filter(
    (v) => v === 'against',
  ).length
  const detailedAbstentions = Object.values(votes).filter(
    (v) => v === 'abstain',
  ).length

  // ========================================================================
  // QUICK MODE STATE
  // ========================================================================

  const [quickFor, setQuickFor] = useState(0)
  const [quickAgainst, setQuickAgainst] = useState(0)
  const quickAbstentions = Math.max(0, totalEligible - quickFor - quickAgainst)

  // ========================================================================
  // ACTIVE VALUES (based on mode)
  // ========================================================================

  const votesForCount = mode === 'quick' ? quickFor : detailedForCount
  const votesAgainstCount =
    mode === 'quick' ? quickAgainst : detailedAgainstCount
  const abstentions = mode === 'quick' ? quickAbstentions : detailedAbstentions
  const willPass = votesForCount > votesAgainstCount

  const handleConfirm = () => {
    if (mode === 'detailed') {
      const forIds = Object.entries(votes)
        .filter(([_, vote]) => vote === 'for')
        .map(([id]) => id)
      const againstIds = Object.entries(votes)
        .filter(([_, vote]) => vote === 'against')
        .map(([id]) => id)
      onVoteComplete(forIds.length, againstIds.length, forIds, againstIds)
    } else {
      onVoteComplete(quickFor, quickAgainst)
    }
  }

  if (!nominee) return null

  return (
    <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='bg-gradient-to-b from-red-900/50 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          {/* Back button row */}
          <div className='flex items-center mb-4'>
            <BackButton onClick={onCancel} />
            <span className='text-parchment-500 text-xs ml-1'>
              {t.game.cancelNomination}
            </span>
          </div>

          {/* Title section */}
          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name='scale' size='3xl' className='text-red-400' />
            </div>
            <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase'>
              {interpolate(t.game.executePlayer, {
                player: nominee.name,
              })}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {t.game.yesVsNoNeeded}
            </p>
          </div>
        </div>
      </div>

      {/* Vote Tally */}
      <div className='px-4 max-w-lg mx-auto w-full'>
        <div className='flex justify-around py-4 border-b border-white/10'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>
              {votesForCount}
            </div>
            <div className='text-green-300/70 text-xs uppercase tracking-wider'>
              {t.game.votesFor}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-red-400'>
              {votesAgainstCount}
            </div>
            <div className='text-red-300/70 text-xs uppercase tracking-wider'>
              {t.game.votesAgainst}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-parchment-500'>
              {abstentions}
            </div>
            <div className='text-parchment-500/70 text-xs uppercase tracking-wider'>
              {t.game.abstain}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className='px-4 py-3 max-w-lg mx-auto w-full'>
        <div className='flex rounded-lg bg-white/5 border border-white/10 p-0.5'>
          <button
            onClick={() => setMode('quick')}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-all text-center',
              mode === 'quick'
                ? 'bg-red-900/60 text-parchment-100 border border-red-500/40'
                : 'text-parchment-500 hover:text-parchment-300',
            )}
          >
            {t.game.quickVote}
          </button>
          <button
            onClick={() => setMode('detailed')}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-all text-center',
              mode === 'detailed'
                ? 'bg-red-900/60 text-parchment-100 border border-red-500/40'
                : 'text-parchment-500 hover:text-parchment-300',
            )}
          >
            {t.game.detailedVote}
          </button>
        </div>
      </div>

      {/* Vote Input Area */}
      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        {mode === 'quick' ? (
          <QuickVoteInput
            forCount={quickFor}
            againstCount={quickAgainst}
            maxTotal={totalEligible}
            onForChange={setQuickFor}
            onAgainstChange={setQuickAgainst}
          />
        ) : (
          <DetailedVoteInput
            eligibleVoters={eligibleVoters}
            votes={votes}
            state={state}
            butlerT={butlerT}
            onVote={handleVote}
          />
        )}
      </div>

      {/* Execution Preview */}
      <div className='px-4 max-w-lg mx-auto w-full'>
        <div
          className={cn(
            'rounded-lg p-3 text-center border mb-4',
            willPass
              ? 'bg-red-900/30 border-red-600/50'
              : 'bg-green-900/30 border-green-600/50',
          )}
        >
          {willPass ? (
            <p className='text-red-200 text-sm'>
              {interpolate(t.game.willBeExecuted, {
                player: nominee.name,
                votesFor: votesForCount,
                votesAgainst: votesAgainstCount,
              })}
            </p>
          ) : (
            <p className='text-green-200 text-sm'>
              {interpolate(t.game.willNotBeExecuted, {
                player: nominee.name,
                votesFor: votesForCount,
                votesAgainst: votesAgainstCount,
              })}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-red-500/30'>
        <div className='space-y-2'>
          <Button onClick={handleConfirm} fullWidth variant='evil'>
            {t.game.confirmVotes}
          </Button>
          <Button
            onClick={onCancel}
            fullWidth
            variant='ghost'
            className='text-parchment-400'
          >
            {t.game.cancelNomination}
          </Button>
        </div>
      </ScreenFooter>
    </div>
  )
}

// ============================================================================
// QUICK VOTE INPUT
// ============================================================================

function QuickVoteInput({
  forCount,
  againstCount,
  maxTotal,
  onForChange,
  onAgainstChange,
}: {
  forCount: number
  againstCount: number
  maxTotal: number
  onForChange: (n: number) => void
  onAgainstChange: (n: number) => void
}) {
  const { t } = useI18n()
  const maxFor = maxTotal - againstCount
  const maxAgainst = maxTotal - forCount

  return (
    <div className='space-y-6 py-4'>
      {/* For counter */}
      <div className='text-center'>
        <div className='text-green-300/70 text-xs uppercase tracking-wider mb-3'>
          {t.game.forCount}
        </div>
        <div className='flex items-center justify-center gap-6'>
          <button
            onClick={() => onForChange(Math.max(0, forCount - 1))}
            disabled={forCount <= 0}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90',
              forCount > 0
                ? 'bg-green-900/40 border-2 border-green-500/40 text-green-400 hover:bg-green-900/60'
                : 'bg-white/5 border border-white/10 text-parchment-600 cursor-not-allowed',
            )}
          >
            <Icon name='minus' size='lg' />
          </button>
          <div className='text-5xl font-bold text-green-400 min-w-[80px] text-center tabular-nums'>
            {forCount}
          </div>
          <button
            onClick={() => onForChange(Math.min(maxFor, forCount + 1))}
            disabled={forCount >= maxFor}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90',
              forCount < maxFor
                ? 'bg-green-900/40 border-2 border-green-500/40 text-green-400 hover:bg-green-900/60'
                : 'bg-white/5 border border-white/10 text-parchment-600 cursor-not-allowed',
            )}
          >
            <Icon name='plus' size='lg' />
          </button>
        </div>
      </div>

      {/* Against counter */}
      <div className='text-center'>
        <div className='text-red-300/70 text-xs uppercase tracking-wider mb-3'>
          {t.game.againstCount}
        </div>
        <div className='flex items-center justify-center gap-6'>
          <button
            onClick={() => onAgainstChange(Math.max(0, againstCount - 1))}
            disabled={againstCount <= 0}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90',
              againstCount > 0
                ? 'bg-red-900/40 border-2 border-red-500/40 text-red-400 hover:bg-red-900/60'
                : 'bg-white/5 border border-white/10 text-parchment-600 cursor-not-allowed',
            )}
          >
            <Icon name='minus' size='lg' />
          </button>
          <div className='text-5xl font-bold text-red-400 min-w-[80px] text-center tabular-nums'>
            {againstCount}
          </div>
          <button
            onClick={() =>
              onAgainstChange(Math.min(maxAgainst, againstCount + 1))
            }
            disabled={againstCount >= maxAgainst}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90',
              againstCount < maxAgainst
                ? 'bg-red-900/40 border-2 border-red-500/40 text-red-400 hover:bg-red-900/60'
                : 'bg-white/5 border border-white/10 text-parchment-600 cursor-not-allowed',
            )}
          >
            <Icon name='plus' size='lg' />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DETAILED VOTE INPUT
// ============================================================================

function DetailedVoteInput({
  eligibleVoters,
  votes,
  state,
  butlerT,
  onVote,
}: {
  eligibleVoters: PlayerState[]
  votes: Record<string, VoteValue>
  state: GameState
  butlerT: Record<string, string | undefined>
  onVote: (playerId: string, vote: VoteValue) => void
}) {
  const { t } = useI18n()

  return (
    <div className='space-y-2'>
      {eligibleVoters.map((player) => {
        const isDead = hasEffect(player, 'dead')
        const butlerMasterName = getButlerMasterName(player, state)
        const currentVote = votes[player.id]

        return (
          <div
            key={player.id}
            className={cn(
              'rounded-lg p-3',
              butlerMasterName
                ? 'border-2 border-amber-500/50 bg-amber-950/20'
                : 'border border-white/10',
            )}
          >
            <div className='flex items-center gap-2 mb-2'>
              {isDead && (
                <Icon name='skull' size='sm' className='text-parchment-500' />
              )}
              <span className='text-parchment-200 text-sm flex-1'>
                {player.name}
              </span>
            </div>
            {butlerMasterName && (
              <div className='flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-amber-900/30 border border-amber-500/30'>
                <Icon name='handHeart' size='sm' className='text-amber-400' />
                <span className='text-amber-300 text-xs font-medium'>
                  {interpolate(butlerT.masterLabel ?? '', {
                    player: butlerMasterName,
                  })}
                </span>
                <span className='text-amber-400/60 text-xs ml-auto'>
                  {butlerT.voteRestriction}
                </span>
              </div>
            )}
            <div className='flex gap-2'>
              <button
                onClick={() => onVote(player.id, 'for')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 active:scale-[0.95] min-h-[48px]',
                  currentVote === 'for'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                )}
              >
                <Icon name='thumbsUp' size='sm' />
                <span className='text-[10px] leading-tight'>
                  {t.game.votesFor}
                </span>
              </button>
              <button
                onClick={() => onVote(player.id, 'against')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 active:scale-[0.95] min-h-[48px]',
                  currentVote === 'against'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                )}
              >
                <Icon name='thumbsDown' size='sm' />
                <span className='text-[10px] leading-tight'>
                  {t.game.votesAgainst}
                </span>
              </button>
              <button
                onClick={() => onVote(player.id, 'abstain')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 active:scale-[0.95] min-h-[48px]',
                  currentVote === 'abstain'
                    ? 'bg-parchment-500 text-grimoire-dark'
                    : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                )}
              >
                <Icon name='minus' size='sm' />
                <span className='text-[10px] leading-tight'>
                  {t.game.abstain}
                </span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
