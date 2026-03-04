import { useMemo, useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import { registerRoleTranslations, getRoleTranslations, useI18n } from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  PlayerNumberRevealScreen,
  StorytellerNumberScreen,
} from '../../../../../components/screens/SectsAndVioletsActionScreens'
import {
  countClosestMinionDistance,
} from '../helpers'
import { shouldForceFalseInfo } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('clockmaker', 'en', en)
registerRoleTranslations('clockmaker', 'es', es)

const definition: RoleDefinition = {
  id: 'clockmaker',
  team: 'townsfolk',
  icon: 'history',
  nightOrder: 16,
  chaos: 24,
  shouldWake: (game, player) =>
    isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('clockmaker', language)
    const actualDistance = useMemo(() => countClosestMinionDistance(state), [state])
    const malfunctioning = shouldForceFalseInfo(state, player)
    const [shownDistance, setShownDistance] = useState(actualDistance)
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
                content: `${player.name} learned a Clockmaker distance of ${shownDistance}.`,
              },
            ],
            data: {
              roleId: 'clockmaker',
              playerId: player.id,
              action: 'clockmaker_info',
              distance: shownDistance,
              ...(malfunctioning ? { malfunctioned: true, actualDistance } : {}),
            },
          },
        ],
      })
    }

    if (phase === 'configure') {
      return (
        <StorytellerNumberScreen
          icon='history'
          title={roleT.configureTitle}
          description={roleT.configureDescription}
          value={shownDistance}
          min={0}
          max={Math.max(12, state.players.length)}
          confirmLabel={roleT.configureConfirm}
          onChange={setShownDistance}
          onConfirm={() => setPhase('show_result')}
        />
      )
    }

    return (
      <PlayerNumberRevealScreen
        playerName={player.name}
        icon='history'
        title={roleT.infoTitle}
        subtitle={roleT.name}
        label={roleT.distanceLabel}
        value={shownDistance}
        onComplete={complete}
      />
    )
  },
}

export default definition
