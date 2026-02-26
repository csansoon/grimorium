import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { EvilTeamReveal } from '../../../../../components/items/EvilTeamReveal'
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

type Phase = 'step_list' | 'show_evil_team' | 'view_grimoire'

/**
 * The Spy — Minion role.
 *
 * First night: Shown the evil team (other Minions + Demon), then views
 * the Grimoire.
 *
 * Subsequent nights: Views the Grimoire only.
 *
 * You might register as good & as a Townsfolk or Outsider, even if you
 * are dead. Misregistration is handled by the `misregister` effect.
 *
 * When malfunctioning (Poisoned/Drunk), the Spy does NOT see the
 * Grimoire. The narrator handles deception manually.
 */
const definition: RoleDefinition = {
  id: 'spy',
  team: 'minion',
  icon: 'hatGlasses',
  nightOrder: 36, // Late — sees up-to-date state after most actions
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
      id: 'show_evil_team',
      icon: 'swords',
      getLabel: (t) => t.game.stepShowEvilTeam,
      condition: (_game, _player, state) => state.round === 1,
      audience: 'player_reveal',
    },
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
    const [phase, setPhase] = useState<Phase>('step_list')
    const [showEvilTeamDone, setShowEvilTeamDone] = useState(false)

    const isFirstNight = state.round === 1
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

    // ================================================================
    // RENDER: Step List
    // ================================================================

    if (phase === 'step_list') {
      const steps: NightStep[] = []

      if (isFirstNight) {
        steps.push({
          id: 'show_evil_team',
          icon: 'swords',
          label: t.game.stepShowEvilTeam,
          status: showEvilTeamDone ? 'done' : 'pending',
          audience: 'player_reveal' as const,
        })
      }

      steps.push({
        id: 'view_grimoire',
        icon: 'bookUser',
        label: t.game.stepViewGrimoire,
        status: 'pending',
        audience: 'player_reveal' as const,
      })

      return (
        <NightStepListLayout
          icon='hatGlasses'
          roleName={getRoleName('spy', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={(stepId) => setPhase(stepId as Phase)}
        />
      )
    }

    // ================================================================
    // RENDER: Show Evil Team (first night, player-facing)
    // ================================================================

    if (phase === 'show_evil_team') {
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

            <HandbackButton
              onClick={() => {
                setShowEvilTeamDone(true)
                setPhase('step_list')
              }}
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
    }

    // ================================================================
    // RENDER: Malfunctioning — don't show real Grimoire
    // ================================================================

    if (malfunctioning) {
      return (
        <NightActionLayout
          player={player}
          title={roleT.spyMalfunctionTitle}
          description={roleT.spyMalfunctionDescription}
          audience="narrator"
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

    // ================================================================
    // RENDER: View Grimoire (player-facing)
    // Uses shared Grimoire; when a player is tapped, opens modal (read-only, no Edit effects)
    // ================================================================

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
              onPlayerSelect={(p) =>
                onOpenGrimoire?.({ view: 'player_detail', player: p }, true)
              }
            />
          </div>

          <HandbackButton onClick={handleComplete} fullWidth size='lg' variant='evil'>
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  },
}

export default definition
