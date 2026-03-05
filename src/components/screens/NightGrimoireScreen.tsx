import { useState } from 'react'
import { GameState, PlayerState } from '../../lib/types'
import { useI18n } from '../../lib/i18n'
import { Button, Icon } from '../atoms'
import { StorytellerGrimoireBoard } from '../items'
import { ScreenFooter } from '../layouts/ScreenFooter'

type Props = {
  state: GameState
  hasPendingPrep: boolean
  onContinue: () => void
  onOpenPlayer: (player: PlayerState) => void
  onSwapPlayers: (sourcePlayerId: string, targetPlayerId: string) => void
}

export function NightGrimoireScreen({
  state,
  hasPendingPrep,
  onContinue,
  onOpenPlayer,
  onSwapPlayers,
}: Props) {
  const { t } = useI18n()
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    state.players[0]?.id ?? null,
  )
  const [reseatMode, setReseatMode] = useState(false)
  const [swapSourcePlayerId, setSwapSourcePlayerId] = useState<string | null>(
    null,
  )

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='bg-gradient-to-b from-mystic-gold/10 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto text-center'>
          <div className='flex justify-center mb-2'>
            <Icon
              name='bookUser'
              size='3xl'
              className='text-mystic-gold text-glow-gold'
            />
          </div>
          <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
            {t.game.grimoire}
          </h1>
          <p className='text-parchment-400 text-sm'>
            {t.game.grimoireReviewSubtitle}
          </p>
          <p className='text-parchment-600 text-xs mt-3'>
            {t.game.grimoireReviewHint}
          </p>
        </div>
      </div>

      <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto space-y-4'>
        <StorytellerGrimoireBoard
          state={state}
          title={t.game.grimoireCircle}
          selectedPlayerId={selectedPlayerId}
          onPlayerSelect={(player) => {
            setSelectedPlayerId(player.id)
            if (reseatMode) {
              setSwapSourcePlayerId((current) =>
                current === player.id ? null : player.id,
              )
              return
            }
            onOpenPlayer(player)
          }}
          onPlayerSwap={(sourcePlayerId, targetPlayerId) => {
            onSwapPlayers(sourcePlayerId, targetPlayerId)
            setSelectedPlayerId(targetPlayerId)
            setSwapSourcePlayerId(null)
          }}
          reseatMode={reseatMode}
          swapSourcePlayerId={swapSourcePlayerId}
          onToggleReseatMode={() => {
            setReseatMode((current) => !current)
            setSwapSourcePlayerId(null)
          }}
        />
      </div>

      <ScreenFooter>
        <Button onClick={onContinue} fullWidth size='lg' variant='dawn'>
          <Icon name='arrowRight' size='md' className='mr-2' />
          {hasPendingPrep
            ? t.game.continueToNightPrep
            : t.game.continueToNightActions}
        </Button>
      </ScreenFooter>
    </div>
  )
}
