import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  PlayerBooleanRevealScreen,
  StorytellerBooleanScreen,
} from '../../../../../components/screens/SectsAndVioletsActionScreens'
import { didDemonVoteToday } from '../helpers'
import { shouldForceFalseInfo } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('flowergirl', 'en', en)
registerRoleTranslations('flowergirl', 'es', es)

const definition: RoleDefinition = {
  id: 'flowergirl',
  team: 'townsfolk',
  icon: 'flower',
  nightOrder: 42,
  chaos: 27,
  shouldWake: (game, player) =>
    isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, game, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('flowergirl', language)
    const actualValue = didDemonVoteToday(game)
    const malfunctioning = shouldForceFalseInfo(state, player)
    const [shownValue, setShownValue] = useState(actualValue)
    const [phase, setPhase] = useState<'configure' | 'show_result'>(
      malfunctioning ? 'configure' : 'show_result',
    )

    const complete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} learned that the Demon ${shownValue ? 'did' : 'did not'} vote today.`,
              },
            ],
            data: {
              roleId: 'flowergirl',
              playerId: player.id,
              action: 'flowergirl_info',
              demonVoted: shownValue,
              ...(malfunctioning ? { malfunctioned: true, actualValue } : {}),
            },
          },
        ],
      })
    }

    if (phase === 'configure') {
      return (
        <StorytellerBooleanScreen
          icon='flower'
          title={roleT.configureTitle}
          description={roleT.configureDescription}
          trueLabel={roleT.yesLabel}
          falseLabel={roleT.noLabel}
          onSelect={(value) => {
            setShownValue(value)
            setPhase('show_result')
          }}
        />
      )
    }

    return (
      <PlayerBooleanRevealScreen
        playerName={player.name}
        icon='flower'
        title={roleT.infoTitle}
        subtitle={roleT.name}
        question={roleT.question}
        value={shownValue}
        trueText={roleT.yesLabel}
        falseText={roleT.noLabel}
        onComplete={complete}
      />
    )
  },
}

export default definition
