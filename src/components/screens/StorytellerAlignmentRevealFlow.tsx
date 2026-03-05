import { useMemo, useState } from 'react'
import { GameState } from '../../lib/types'
import { useI18n } from '../../lib/i18n'
import {
  PlayerBooleanRevealScreen,
  StorytellerBooleanScreen,
  StorytellerChoiceScreen,
} from './SectsAndVioletsActionScreens'

type Alignment = 'good' | 'evil'

type Props = {
  state: GameState
  onClose: () => void
}

export function StorytellerAlignmentRevealFlow({ state, onClose }: Props) {
  const { t } = useI18n()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [selectedAlignment, setSelectedAlignment] = useState<Alignment | null>(
    null,
  )

  const selectedPlayer = useMemo(
    () =>
      selectedPlayerId
        ? state.players.find((player) => player.id === selectedPlayerId) ?? null
        : null,
    [selectedPlayerId, state.players],
  )

  if (!selectedPlayerId || !selectedPlayer) {
    return (
      <StorytellerChoiceScreen
        state={state}
        icon='userRound'
        title={t.game.revealAlignment}
        description={t.game.selectPlayerForAlignmentReveal}
        confirmLabel={t.common.continue}
        onBack={onClose}
        onConfirm={(selectedIds) => setSelectedPlayerId(selectedIds[0] ?? null)}
      />
    )
  }

  if (!selectedAlignment) {
    return (
      <StorytellerBooleanScreen
        icon='scale'
        title={t.game.revealAlignment}
        description={t.game.chooseAlignmentToShow.replace(
          '{player}',
          selectedPlayer.name,
        )}
        trueLabel={t.game.youAreGood}
        falseLabel={t.game.youAreEvil}
        onBack={() => setSelectedPlayerId(null)}
        onSelect={(value) => setSelectedAlignment(value ? 'good' : 'evil')}
      />
    )
  }

  return (
    <PlayerBooleanRevealScreen
      playerName={selectedPlayer.name}
      icon='scale'
      title={t.game.revealAlignment}
      subtitle={selectedPlayer.name}
      question={t.game.yourAlignmentIs}
      value={selectedAlignment === 'good'}
      trueText={t.game.youAreGood}
      falseText={t.game.youAreEvil}
      onComplete={onClose}
    />
  )
}
