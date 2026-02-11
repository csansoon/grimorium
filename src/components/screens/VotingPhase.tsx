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
  onVoteComplete: (votesFor: string[], votesAgainst: string[]) => void
  onCancel: () => void
}

type VoteValue = 'for' | 'against' | 'abstain' | null

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
  const master = state.players.find((p) => p.id === butlerEffect.data!.masterId)
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

  // Preselect all eligible voters to "abstain"
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

  const handleConfirm = () => {
    const votesFor = Object.entries(votes)
      .filter(([_, vote]) => vote === 'for')
      .map(([id]) => id)
    const votesAgainst = Object.entries(votes)
      .filter(([_, vote]) => vote === 'against')
      .map(([id]) => id)
    onVoteComplete(votesFor, votesAgainst)
  }

  const votesForCount = Object.values(votes).filter((v) => v === 'for').length
  const votesAgainstCount = Object.values(votes).filter(
    (v) => v === 'against',
  ).length
  const abstentions = Object.values(votes).filter((v) => v === 'abstain').length

  const willPass = votesForCount > votesAgainstCount

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
            <p className='text-parchment-400 text-sm'>{t.game.yesVsNoNeeded}</p>
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

      {/* Voters */}
      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto'>
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
                    <Icon
                      name='skull'
                      size='sm'
                      className='text-parchment-500'
                    />
                  )}
                  <span className='text-parchment-200 text-sm flex-1'>
                    {player.name}
                  </span>
                </div>
                {butlerMasterName && (
                  <div className='flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-amber-900/30 border border-amber-500/30'>
                    <Icon
                      name='handHeart'
                      size='sm'
                      className='text-amber-400'
                    />
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
                    onClick={() => handleVote(player.id, 'for')}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1',
                      currentVote === 'for'
                        ? 'bg-green-600 text-white'
                        : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                    )}
                  >
                    <Icon name='thumbsUp' size='sm' />
                  </button>
                  <button
                    onClick={() => handleVote(player.id, 'against')}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1',
                      currentVote === 'against'
                        ? 'bg-red-600 text-white'
                        : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                    )}
                  >
                    <Icon name='thumbsDown' size='sm' />
                  </button>
                  <button
                    onClick={() => handleVote(player.id, 'abstain')}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1',
                      currentVote === 'abstain'
                        ? 'bg-parchment-500 text-grimoire-dark'
                        : 'bg-white/5 text-parchment-400 hover:bg-white/10',
                    )}
                  >
                    <Icon name='minus' size='sm' />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
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
