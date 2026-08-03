import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
  getRoleName,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { PlayerPickerList, RolePickerGrid } from '../../../../../components/inputs'
import { Button, Icon, BackButton } from '../../../../../components/atoms'
import { ScreenFooter } from '../../../../../components/layouts/ScreenFooter'
import { PlayerFacingScreen } from '../../../../../components/layouts/PlayerFacingScreen'
import { getRolesForGame } from '../../../index'
import { isGoodRoleId } from '../helpers'
import { canActWhileDeadUnderVigormortis } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('cerenovus', 'en', en)
registerRoleTranslations('cerenovus', 'es', es)

const definition: RoleDefinition = {
  id: 'cerenovus',
  team: 'minion',
  icon: 'drama',
  nightOrder: 7,
  chaos: 68,
  shouldWake: (game, player) =>
    isAlive(player) || canActWhileDeadUnderVigormortis(game, player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ game, state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('cerenovus', language)
    const [phase, setPhase] = useState<'select_player' | 'select_role' | 'show_target'>(
      'select_player',
    )
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const target = state.players.find((candidate) => candidate.id === selectedPlayerId) ?? null
    const scriptRoles = getRolesForGame(game)

    if (phase === 'show_target' && target && selectedRoleId) {
      return (
        <PlayerFacingScreen playerName={target.name}>
          <div className='min-h-app bg-gradient-to-b from-amber-950 via-orange-950/50 to-grimoire-darker flex flex-col'>
            <div className='flex-1 px-6 py-10 flex flex-col items-center justify-center text-center'>
              <div className='w-20 h-20 rounded-full border border-amber-400/30 bg-amber-400/10 flex items-center justify-center mb-6'>
                <Icon name='drama' size='3xl' className='text-amber-300' />
              </div>
              <p className='text-amber-200/70 text-xs uppercase tracking-[0.32em] mb-2'>
                {t.game.showToPlayer}
              </p>
              <h1 className='font-tarot text-3xl text-parchment-100 tracking-widest-xl uppercase mb-4'>
                Cerenovus
              </h1>
              <p className='text-parchment-300 text-base max-w-xs mb-6'>
                You are mad that you are the {getRoleName(selectedRoleId, language)} tomorrow.
              </p>
            </div>
            <ScreenFooter borderColor='border-amber-500/30'>
              <Button
                onClick={() =>
                  onComplete({
                    entries: [
                      {
                        type: 'night_action',
                        message: [
                          { type: 'text', content: `${player.name} made ` },
                          { type: 'player', playerId: target.id },
                          { type: 'text', content: ` mad as ${getRoleName(selectedRoleId, language)}.` },
                        ],
                        data: {
                          roleId: 'cerenovus',
                          playerId: player.id,
                          action: 'cerenovus_madness',
                          targetId: target.id,
                          madAsRoleId: selectedRoleId,
                        },
                      },
                    ],
                    addEffects: {
                      [target.id]: [
                        {
                          type: 'cerenovus_madness',
                          data: { madAsRoleId: selectedRoleId, cerenovusId: player.id },
                          expiresAt: 'end_of_day',
                        },
                      ],
                    },
                  })
                }
                fullWidth
                size='lg'
                variant='primary'
              >
                {t.common.continue}
              </Button>
            </ScreenFooter>
          </div>
        </PlayerFacingScreen>
      )
    }

    if (phase === 'select_role') {
      return (
        <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col'>
          <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
            <div className='max-w-lg mx-auto'>
              <div className='flex items-center mb-4'>
                <BackButton onClick={() => setPhase('select_player')} />
                <span className='text-parchment-500 text-xs ml-1'>
                  {t.common.back}
                </span>
              </div>
              <div className='text-center'>
                <div className='flex justify-center mb-2'>
                  <Icon name='drama' size='3xl' className='text-red-400 text-glow-red' />
                </div>
                <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
                  {roleT.chooseRoleTitle}
                </h1>
                <p className='text-parchment-400 text-sm'>
                  {roleT.chooseRoleDescription}
                </p>
              </div>
            </div>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <RolePickerGrid
              roles={scriptRoles.filter((role) => isGoodRoleId(role.id))}
              state={state}
              selected={selectedRoleId ? [selectedRoleId] : []}
              onSelect={(roleId) =>
                setSelectedRoleId((prev) => (prev === roleId ? null : roleId))
              }
              selectionCount={1}
            />
          </div>
          <ScreenFooter borderColor='border-red-500/30'>
            <Button
              onClick={() => setPhase('show_target')}
              disabled={!selectedRoleId}
              fullWidth
              size='lg'
              variant='slayer'
            >
              {roleT.confirmChoiceLabel}
            </Button>
          </ScreenFooter>
        </div>
      )
    }

    return (
      <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col'>
        <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
          <div className='max-w-lg mx-auto text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name='drama' size='3xl' className='text-red-400 text-glow-red' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              {roleT.chooseTargetTitle}
            </h1>
            <p className='text-parchment-400 text-sm'>
              {roleT.chooseTargetDescription}
            </p>
          </div>
        </div>
        <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
          <PlayerPickerList
            players={state.players.filter((candidate) => candidate.id !== player.id)}
            selected={selectedPlayerId ? [selectedPlayerId] : []}
            onSelect={(playerId) => setSelectedPlayerId(playerId)}
            selectionCount={1}
            variant='red'
          />
        </div>
        <ScreenFooter borderColor='border-red-500/30'>
          <Button
            onClick={() => setPhase('select_role')}
            disabled={!selectedPlayerId}
            fullWidth
            size='lg'
            variant='slayer'
          >
            {t.common.continue}
          </Button>
        </ScreenFooter>
      </div>
    )
  },
}

export default definition
