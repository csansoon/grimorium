import { useState } from 'react'
import { RoleDefinition } from '../../../types'
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
import { Icon } from '../../../../../components/atoms'
import { Grimoire } from '../../../../../components/items/Grimoire'
import { StorytellerGrimoireBoard } from '../../../../../components/items'
import { cn } from '../../../../../lib/utils'
import { isAlive } from '../../../../types'
import { isMalfunctioning } from '../../../../effects'
import { canActWhileDeadUnderVigormortis } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('spy', 'en', en)
registerRoleTranslations('spy', 'es', es)

type Phase = 'step_list' | 'view_grimoire'

const definition: RoleDefinition = {
  id: 'spy',
  team: 'minion',
  icon: 'hatGlasses',
  nightOrder: 36,
  chaos: 55,

  shouldWake: (game, player) =>
    isAlive(player) || canActWhileDeadUnderVigormortis(game, player),

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

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<Phase>('step_list')
    const [grimoireView, setGrimoireView] = useState<'circle' | 'list'>('circle')
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

    if (phase === 'step_list') {
      const steps: NightStep[] = [
        {
          id: 'view_grimoire',
          icon: 'bookUser',
          label: t.game.stepViewGrimoire,
          status: 'pending',
          audience: 'player_reveal' as const,
        },
      ]

      return (
        <NightStepListLayout
          icon='hatGlasses'
          roleName={getRoleName('spy', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={() => setPhase('view_grimoire')}
        />
      )
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout
          player={player}
          title={roleT.grimoireTitle}
          description={roleT.grimoireDescription}
        >
          <div className='mb-6 space-y-3'>
            <div className='flex gap-2'>
              <button
                onClick={() => setGrimoireView('circle')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors',
                  grimoireView === 'circle'
                    ? 'border-mystic-gold/35 bg-mystic-gold/10 text-mystic-gold'
                    : 'border-white/10 text-parchment-500 hover:border-white/20 hover:text-parchment-300',
                )}
              >
                {t.game.grimoireViewCircle}
              </button>
              <button
                onClick={() => setGrimoireView('list')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors',
                  grimoireView === 'list'
                    ? 'border-mystic-gold/35 bg-mystic-gold/10 text-mystic-gold'
                    : 'border-white/10 text-parchment-500 hover:border-white/20 hover:text-parchment-300',
                )}
              >
                {t.game.grimoireViewList}
              </button>
            </div>

            <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
              {grimoireView === 'circle' ? (
                <StorytellerGrimoireBoard state={state} />
              ) : (
                <Grimoire state={state} compact />
              )}
            </div>
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
