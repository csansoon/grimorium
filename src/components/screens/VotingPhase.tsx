import { useMemo, useState } from 'react'
import { GameState, PlayerState, hasEffect } from '../../lib/types'
import { getEffect } from '../../lib/effects'
import { useI18n, interpolate, getRoleTranslations } from '../../lib/i18n'
import { Button, Icon, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'
import { BlockStatus, getVoteThreshold } from '../../lib/game'

type Props = {
  state: GameState
  nomineeId: string
  blockStatus: BlockStatus
  onVoteComplete: (
    voteCount: number,
    votedIds?: string[],
  ) => void
  onCancel: () => void
}

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
  blockStatus,
  onVoteComplete,
  onCancel,
}: Props) {
  const { t, language } = useI18n()
  const butlerT = getRoleTranslations('butler', language)
  const nominee = state.players.find((p) => p.id === nomineeId)

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

  const threshold = getVoteThreshold(state)

  // ========================================================================
  // VOTE STATE — binary: voted or not
  // ========================================================================

  const initialVotes = useMemo(() => {
    const init: Record<string, boolean> = {}
    for (const voter of eligibleVoters) {
      init[voter.id] = false
    }
    return init
  }, [eligibleVoters])

  const [votes, setVotes] = useState<Record<string, boolean>>(initialVotes)

  const handleToggleVote = (playerId: string) => {
    setVotes({ ...votes, [playerId]: !votes[playerId] })
  }

  const voteCount = Object.values(votes).filter(Boolean).length
  const meetsThreshold = voteCount >= threshold

  // Determine execution preview
  type VoteOutcome = 'goes_on_block' | 'replaces_block' | 'tied' | 'not_enough' | 'below_block'
  const getOutcome = (): VoteOutcome => {
    if (!meetsThreshold) return 'not_enough'
    if (!blockStatus) return 'goes_on_block'
    if (voteCount > blockStatus.voteCount) return 'replaces_block'
    if (voteCount === blockStatus.voteCount) return 'tied'
    return 'below_block'
  }
  const outcome = getOutcome()

  const handleConfirm = () => {
    const votedIds = Object.entries(votes)
      .filter(([_, voted]) => voted)
      .map(([id]) => id)
    onVoteComplete(votedIds.length, votedIds)
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
              {interpolate(t.game.votesNeeded, { count: threshold })}
            </p>
          </div>
        </div>
      </div>

      {/* Vote Tally */}
      <div className='px-4 max-w-lg mx-auto w-full'>
        <div className='flex justify-around py-4 border-b border-white/10'>
          <div className='text-center'>
            <div className={cn(
              'text-3xl font-bold',
              meetsThreshold ? 'text-green-400' : 'text-red-400',
            )}>
              {voteCount}
            </div>
            <div className='text-parchment-400/70 text-xs uppercase tracking-wider'>
              {t.game.votesCount}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-parchment-500'>
              {threshold}
            </div>
            <div className='text-parchment-500/70 text-xs uppercase tracking-wider'>
              {interpolate(t.game.voteThreshold, { threshold })}
            </div>
          </div>
        </div>
      </div>

      {/* Current Block Info */}
      {blockStatus && (
        <div className='px-4 max-w-lg mx-auto w-full'>
          <div className='bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mt-3'>
            <div className='flex items-center gap-2'>
              <Icon name='swords' size='sm' className='text-amber-400' />
              <span className='text-amber-200 text-sm'>
                {interpolate(t.game.currentBlock, {
                  player: blockStatus.playerName,
                  count: blockStatus.voteCount,
                })}
              </span>
            </div>
            <p className='text-amber-400/60 text-xs mt-1 ml-6'>
              {interpolate(t.game.needMoreThan, {
                count: blockStatus.voteCount,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Vote Input Area */}
      <div className='flex-1 px-4 py-3 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        <div className='space-y-2'>
          {eligibleVoters.map((player) => {
            const isDead = hasEffect(player, 'dead')
            const butlerMasterName = getButlerMasterName(player, state)
            const voted = votes[player.id]

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
                <button
                  onClick={() => handleToggleVote(player.id)}
                  className={cn(
                    'w-full py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.97] min-h-[48px]',
                    voted
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                  )}
                >
                  <Icon name={voted ? 'check' : 'minus'} size='sm' />
                  <span>{voted ? t.game.voteAction : t.game.dontVote}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Outcome Preview */}
      <div className='px-4 max-w-lg mx-auto w-full'>
        <div
          className={cn(
            'rounded-lg p-3 text-center border mb-4',
            outcome === 'goes_on_block' || outcome === 'replaces_block'
              ? 'bg-green-900/30 border-green-600/50'
              : outcome === 'tied'
                ? 'bg-amber-900/30 border-amber-600/50'
                : 'bg-red-900/30 border-red-600/50',
          )}
        >
          {outcome === 'goes_on_block' && (
            <p className='text-green-200 text-sm'>
              {interpolate(t.game.goesOnBlock, { player: nominee.name })}
            </p>
          )}
          {outcome === 'replaces_block' && (
            <p className='text-green-200 text-sm'>
              {interpolate(t.game.goesOnBlock, { player: nominee.name })}
            </p>
          )}
          {outcome === 'tied' && (
            <p className='text-amber-200 text-sm'>
              {t.game.tiedNoExecution}
            </p>
          )}
          {(outcome === 'not_enough' || outcome === 'below_block') && (
            <p className='text-red-200 text-sm'>
              {t.game.notEnoughVotes}
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
