import { useState } from 'react'
import type { RoleDefinition } from '../../../types'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  NightActionLayout,
  NightStepListLayout,
  PlayerFacingScreen,
  HandbackButton,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { Button, Icon } from '../../../../../components/atoms'
import { Grimoire } from '../../../../../components/items/Grimoire'
import { isAlive } from '../../../../types'
import { isMalfunctioning } from '../../../../effects'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('spy', 'en', en)
registerRoleTranslations('spy', 'es', es)

const definition: RoleDefinition = {
  id: 'spy',
  team: 'minion',
  icon: 'hatGlasses',
  nightOrder: 90,
  firstNightOrder: 90,
  otherNightOrder: 90,
  chaos: 55,
  shouldWake: (_game, player) => isAlive(player),
  initialEffects: [
    {
      type: 'misregister',
      expiresAt: 'never',
      data: {
        canRegisterAs: {
          teams: ['townsfolk', 'outsider'],
          alignments: ['good'],
        },
      },
    },
  ],
  nightSteps: [
    {
      id: 'view_grimoire',
      icon: 'bookUser',
      getLabel: (t) => t.game.stepViewGrimoire,
      audience: 'player_reveal',
    },
  ],
  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete, onOpenGrimoire }) => {
    const { t, language } = useI18n()
    const [viewingGrimoire, setViewingGrimoire] = useState(false)
    const malfunctioning = isMalfunctioning(player)
    const roleT = getRoleTranslations('spy', language)

    const handleComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.spy.history.viewedGrimoire',
                params: { player: player.id },
              },
            ],
            data: {
              roleId: 'spy',
              playerId: player.id,
              action: 'view_grimoire',
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
      })
    }

    if (!viewingGrimoire) {
      const steps: NightStep[] = [
        {
          id: 'view_grimoire',
          icon: 'bookUser',
          label: t.game.stepViewGrimoire,
          status: 'pending',
          audience: 'player_reveal',
        },
      ]
      return (
        <NightStepListLayout
          icon='hatGlasses'
          roleName={getRoleName('spy', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={() => setViewingGrimoire(true)}
        />
      )
    }

    if (malfunctioning) {
      return (
        <NightActionLayout
          player={player}
          title={roleT.spyMalfunctionTitle}
          description={roleT.spyMalfunctionDescription}
          audience='narrator'
        >
          <div className='text-center mb-6'>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/30 border border-amber-600/30'>
              <Icon name='flask' size='md' className='text-amber-400' />
              <span className='text-amber-200 text-sm font-medium'>
                {t.game.malfunctionWarning}
              </span>
            </div>
          </div>

          <Button onClick={handleComplete} fullWidth size='lg' variant='evil'>
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </Button>
        </NightActionLayout>
      )
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout
          player={player}
          title={roleT.spyGrimoireTitle}
          description={roleT.spyGrimoireDescription}
        >
          <div className='mb-6'>
            <Grimoire
              state={state}
              onPlayerSelect={(target) =>
                onOpenGrimoire?.(
                  { view: 'player_detail', player: target },
                  true,
                )
              }
            />
          </div>

          <HandbackButton
            onClick={handleComplete}
            fullWidth
            size='lg'
            variant='evil'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  },
}

export default definition
