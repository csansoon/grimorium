import { EffectDefinition } from '../../types'
import {
  DayActionDefinition,
  DayActionProps,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'
import { getCurrentTeam } from '../../../identity'
import { StorytellerChoiceScreen } from '../../../../components/screens/SectsAndVioletsActionScreens'

function KlutzResolution({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  return (
    <StorytellerChoiceScreen
      state={state}
      icon='drama'
      title='Klutz'
      description='Record which player the Klutz publicly chose.'
      confirmLabel='Resolve Klutz choice'
      players={state.players.filter((player) => player.id !== playerId)}
      onBack={onBack}
      onConfirm={([targetId]) => {
        const target = state.players.find((player) => player.id === targetId)
        const targetTeam = target ? getCurrentTeam(target) : null
        const evilWins = Boolean(
          targetTeam &&
            targetTeam !== 'townsfolk' &&
            targetTeam !== 'outsider',
        )

        onComplete({
          entries: [
            {
              type: 'execution',
              message: [
                { type: 'text', content: 'Klutz chose ' },
                { type: 'player', playerId: targetId },
                evilWins
                  ? { type: 'text', content: '. Evil wins.' }
                  : { type: 'text', content: '.' },
              ],
              data: {
                playerId,
                targetId,
                klutzTriggered: true,
                targetWasEvil: evilWins,
              },
            },
          ],
          removeEffects: {
            [playerId]: ['klutz_choice_pending'],
          },
          winner: evilWins ? 'demon' : undefined,
        })
      }}
    />
  )
}

const dayAction: DayActionDefinition = {
  id: 'klutz_resolve',
  icon: 'drama',
  category: 'resolution',
  getLabel: () => 'Resolve Klutz',
  getDescription: () => 'Choose the player the Klutz pointed at.',
  condition: (player) => hasEffect(player, 'klutz_choice_pending'),
  ActionComponent: KlutzResolution,
}

const definition: EffectDefinition = {
  id: 'klutz_choice_pending',
  icon: 'drama',
  defaultType: 'pending',
  dayActions: [dayAction],
}

export default definition
