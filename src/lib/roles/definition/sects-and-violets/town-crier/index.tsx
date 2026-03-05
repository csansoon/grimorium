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
import { didMinionNominateToday } from '../helpers'
import { getFalseInfoMode, shouldForceFalseInfo } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('town_crier', 'en', en)
registerRoleTranslations('town_crier', 'es', es)

const definition: RoleDefinition = {
  id: 'town_crier',
  team: 'townsfolk',
  icon: 'conciergeBell',
  nightOrder: 43,
  chaos: 28,
  shouldWake: (game, player) =>
    isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, game, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('town_crier', language)
    const actualValue = didMinionNominateToday(game)
    const falseInfoMode = getFalseInfoMode(state, player)
    const malfunctioning = shouldForceFalseInfo(state, player)
    const [shownValue, setShownValue] = useState(actualValue)
    const [phase, setPhase] = useState<'configure' | 'show_result'>('configure')

    const complete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} learned that a Minion ${shownValue ? 'did' : 'did not'} nominate today.`,
              },
            ],
            data: {
              roleId: 'town_crier',
              playerId: player.id,
              action: 'town_crier_info',
              minionNominated: shownValue,
              ...(malfunctioning ? { malfunctioned: true, actualValue } : {}),
            },
          },
        ],
      })
    }

    if (phase === 'configure') {
      return (
        <StorytellerBooleanScreen
          icon='conciergeBell'
          title={roleT.configureTitle}
          description={roleT.configureDescription}
          trueLabel={roleT.yesLabel}
          falseLabel={roleT.noLabel}
          falseInfoMode={falseInfoMode}
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
        icon='conciergeBell'
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
