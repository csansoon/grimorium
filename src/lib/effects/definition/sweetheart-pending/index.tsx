import { EffectDefinition } from '../../types'
import {
  DayActionDefinition,
  DayActionProps,
  NightFollowUpDefinition,
  NightFollowUpProps,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'
import { StorytellerChoiceScreen } from '../../../../components/screens/SectsAndVioletsActionScreens'

function SweetheartResolution({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  return (
    <StorytellerChoiceScreen
      state={state}
      icon='handHeart'
      title='Sweetheart'
      description='Choose which player becomes drunk.'
      confirmLabel='Make this player drunk'
      players={state.players}
      onBack={onBack}
      onConfirm={([targetId]) =>
        onComplete({
          entries: [
            {
              type: 'effect_added',
              message: [
                { type: 'text', content: 'Sweetheart drunk: ' },
                { type: 'player', playerId: targetId },
              ],
              data: {
                playerId: targetId,
                effectType: 'drunk',
                sourceRole: 'sweetheart',
              },
            },
          ],
          addEffects: {
            [targetId]: [{ type: 'drunk', expiresAt: 'never' }],
          },
          removeEffects: {
            [playerId]: ['sweetheart_pending'],
          },
        })
      }
    />
  )
}

function SweetheartNightFollowUp({
  state,
  playerId,
  onComplete,
}: NightFollowUpProps) {
  return (
    <StorytellerChoiceScreen
      state={state}
      icon='handHeart'
      title='Sweetheart'
      description='Choose which player becomes drunk.'
      confirmLabel='Make this player drunk'
      players={state.players}
      onConfirm={([targetId]) =>
        onComplete({
          entries: [
            {
              type: 'effect_added',
              message: [
                { type: 'text', content: 'Sweetheart drunk: ' },
                { type: 'player', playerId: targetId },
              ],
              data: {
                playerId: targetId,
                effectType: 'drunk',
                sourceRole: 'sweetheart',
              },
            },
          ],
          addEffects: {
            [targetId]: [{ type: 'drunk', expiresAt: 'never' }],
          },
          removeEffects: {
            [playerId]: ['sweetheart_pending'],
          },
        })
      }
    />
  )
}

const dayAction: DayActionDefinition = {
  id: 'sweetheart_resolve',
  icon: 'handHeart',
  category: 'resolution',
  getLabel: () => 'Resolve Sweetheart',
  getDescription: () => 'Choose who becomes drunk after Sweetheart dies.',
  condition: (player) => hasEffect(player, 'sweetheart_pending'),
  ActionComponent: SweetheartResolution,
}

const nightFollowUp: NightFollowUpDefinition = {
  id: 'sweetheart_resolve',
  icon: 'handHeart',
  getLabel: () => 'Resolve Sweetheart',
  condition: (player) => hasEffect(player, 'sweetheart_pending'),
  ActionComponent: SweetheartNightFollowUp,
}

const definition: EffectDefinition = {
  id: 'sweetheart_pending',
  icon: 'handHeart',
  defaultType: 'pending',
  dayActions: [dayAction],
  nightFollowUps: [nightFollowUp],
}

export default definition
