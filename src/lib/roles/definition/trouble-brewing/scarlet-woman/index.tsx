import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { EvilTeamReveal } from '../../../../../components/items/EvilTeamReveal'
import {
  registerRoleTranslations,
  useI18n,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import {
  NightActionLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { Button, Icon } from '../../../../../components/atoms'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('scarlet_woman', 'en', en)
registerRoleTranslations('scarlet_woman', 'es', es)

type Phase = 'step_list' | 'show_evil_team'

/**
 * Scarlet Woman — Minion role.
 *
 * If there are 5 or more players alive and the Demon dies,
 * the Scarlet Woman becomes the Demon.
 *
 * This is a mostly passive role. The demon-succession behavior is on the
 * `demon_successor` effect, which intercepts kill and execute intents
 * targeting Demons.
 *
 * First night: Shown the evil team (other Minions + Demon).
 * Subsequent nights: Does not wake.
 */
const definition: RoleDefinition = {
  id: 'scarlet_woman',
  team: 'minion',
  icon: 'rose',
  nightOrder: 4, // Very early — just show info, before action roles
  chaos: 50,

  shouldWake: (game) => {
    const state = game.history.at(-1)?.stateAfter
    return state?.round === 1
  },

  // Scarlet Woman gets demon_successor effect at game start
  initialEffects: [{ type: 'demon_successor', expiresAt: 'never' }],

  nightSteps: [
    {
      id: 'show_evil_team',
      icon: 'swords',
      getLabel: (t) => t.game.stepShowEvilTeam,
      condition: (_game, _player, state) => state.round === 1,
      audience: 'player_reveal',
    },
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')

    const roleT = getRoleTranslations('scarlet_woman', language)

    const handleComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.scarlet_woman.history.shownEvilTeam',
                params: { player: player.id },
              },
            ],
            data: {
              roleId: 'scarlet_woman',
              playerId: player.id,
              action: 'first_night_info',
            },
          },
        ],
      })
    }

    // ================================================================
    // RENDER: Step List
    // ================================================================

    if (phase === 'step_list') {
      const steps: NightStep[] = [
        {
          id: 'show_evil_team',
          icon: 'swords',
          label: t.game.stepShowEvilTeam,
          status: 'pending',
          audience: 'player_reveal' as const,
        },
      ]

      return (
        <NightStepListLayout
          icon='rose'
          roleName={getRoleName('scarlet_woman', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={() => setPhase('show_evil_team')}
        />
      )
    }

    // ================================================================
    // RENDER: Show Evil Team (player-facing)
    // ================================================================

    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout
          player={player}
          title={roleT.evilTeamTitle}
          description={roleT.evilTeamDescription}
        >
          <div className='mb-6'>
            <EvilTeamReveal
              state={state}
              viewer={player}
              viewerType='minion'
            />
          </div>

          <Button onClick={handleComplete} fullWidth size='lg' variant='evil'>
            <Icon name='check' size='md' className='mr-2' />
            {t.common.iUnderstandMyRole}
          </Button>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  },
}

export default definition
