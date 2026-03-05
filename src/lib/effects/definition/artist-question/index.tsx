import { useState } from 'react'
import { EffectDefinition } from '../../types'
import { DayActionDefinition, DayActionProps } from '../../../pipeline/types'
import { hasEffect, isAlive } from '../../../types'
import {
  PlayerBooleanRevealScreen,
  StorytellerTextBooleanScreen,
} from '../../../../components/screens/SectsAndVioletsActionScreens'
import { getFalseInfoMode } from '../../../roles/runtime-helpers'

function ArtistQuestionScreen({
  state,
  playerId,
  onComplete,
}: DayActionProps) {
  const player = state.players.find((candidate) => candidate.id === playerId)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<boolean | null>(null)
  if (!player) return null
  const falseInfoMode = getFalseInfoMode(state, player)

  if (answer !== null) {
    return (
      <PlayerBooleanRevealScreen
        playerName={player.name}
        icon='pencil'
        title='Artist'
        subtitle={player.name}
        question={question || 'Your question'}
        value={answer}
        trueText='Yes'
        falseText='No'
        onComplete={() =>
          onComplete({
            entries: [
              {
                type: 'artist_question',
                message: [
                  {
                    type: 'text',
                    content: `${player.name} asked: "${question || 'Question not recorded'}" Answer: ${answer ? 'Yes' : 'No'}.`,
                  },
                ],
                data: {
                  playerId,
                  question,
                  answer,
                },
              },
            ],
            removeEffects: { [playerId]: ['artist_question'] },
          })
        }
      />
    )
  }

  return (
    <StorytellerTextBooleanScreen
      icon='pencil'
      title='Artist Question'
      description='Record the question and choose the truthful yes/no answer.'
      falseInfoMode={falseInfoMode}
      questionLabel='Question'
      question={question}
      onQuestionChange={setQuestion}
      trueLabel='Answer Yes'
      falseLabel='Answer No'
      onSelect={(value) => setAnswer(value)}
    />
  )
}

const artistDayAction: DayActionDefinition = {
  id: 'artist_question',
  icon: 'pencil',
  getLabel: (t) => t.game.artistAction ?? 'Artist Question',
  getDescription: (t) =>
    t.game.artistActionDescription ??
    'Ask the Storyteller any yes/no question.',
  condition: (player) => isAlive(player) && hasEffect(player, 'artist_question'),
  ActionComponent: ArtistQuestionScreen,
}

const definition: EffectDefinition = {
  id: 'artist_question',
  icon: 'pencil',
  defaultType: 'buff',
  persistence: {
    targetRoleChange: 'remove',
  },
  dayActions: [artistDayAction],
}

export default definition
