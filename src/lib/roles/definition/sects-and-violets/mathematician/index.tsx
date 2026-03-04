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
  PlayerNumberRevealScreen,
  StorytellerNumberScreen,
} from '../../../../../components/screens/SectsAndVioletsActionScreens'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('mathematician', 'en', en)
registerRoleTranslations('mathematician', 'es', es)

const definition: RoleDefinition = {
  id: 'mathematician',
  team: 'townsfolk',
  icon: 'bookMarked',
  nightOrder: 17,
  chaos: 40,
  shouldWake: (_game, player) => isAlive(player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('mathematician', language)
    const [shownValue, setShownValue] = useState(0)
    const [phase, setPhase] = useState<'configure' | 'show_result'>('configure')

    const complete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} learned a Mathematician value of ${shownValue}.`,
              },
            ],
            data: {
              roleId: 'mathematician',
              playerId: player.id,
              action: 'mathematician_info',
              abnormalCount: shownValue,
            },
          },
        ],
      })
    }

    if (phase === 'configure') {
      return (
        <StorytellerNumberScreen
          icon='bookMarked'
          title={roleT.configureTitle}
          description={roleT.configureDescription}
          value={shownValue}
          min={0}
          max={state.players.length}
          confirmLabel={roleT.configureConfirm}
          onChange={setShownValue}
          onConfirm={() => setPhase('show_result')}
        />
      )
    }

    return (
      <PlayerNumberRevealScreen
        playerName={player.name}
        icon='bookMarked'
        title={roleT.infoTitle}
        subtitle={roleT.name}
        label={roleT.countLabel}
        value={shownValue}
        onComplete={complete}
      />
    )
  },
}

export default definition
