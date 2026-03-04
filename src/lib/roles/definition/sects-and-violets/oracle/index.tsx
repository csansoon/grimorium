import { useMemo, useState } from 'react'
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
import { countDeadEvilPlayers } from '../helpers'
import { shouldForceFalseInfo } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('oracle', 'en', en)
registerRoleTranslations('oracle', 'es', es)

const definition: RoleDefinition = {
  id: 'oracle',
  team: 'townsfolk',
  icon: 'bookMarked',
  nightOrder: 41,
  chaos: 30,
  shouldWake: (game, player) =>
    isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('oracle', language)
    const actualCount = useMemo(
      () => countDeadEvilPlayers(state, player),
      [player, state],
    )
    const malfunctioning = shouldForceFalseInfo(state, player)
    const [shownCount, setShownCount] = useState(actualCount)
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
                content: `${player.name} learned that ${shownCount} dead players are evil.`,
              },
            ],
            data: {
              roleId: 'oracle',
              playerId: player.id,
              action: 'oracle_info',
              deadEvilCount: shownCount,
              ...(malfunctioning ? { malfunctioned: true, actualCount } : {}),
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
          value={shownCount}
          min={0}
          max={state.players.length}
          confirmLabel={roleT.configureConfirm}
          onChange={setShownCount}
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
        value={shownCount}
        onComplete={complete}
      />
    )
  },
}

export default definition
