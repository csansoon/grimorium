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
import { getRolesForGame } from '../../../index'
import { canActWhileDeadUnderVigormortis } from '../../../runtime-helpers'
import { buildTransformationStateChanges } from '../../../../transformations'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('pit_hag', 'en', en)
registerRoleTranslations('pit_hag', 'es', es)

const definition: RoleDefinition = {
  id: 'pit_hag',
  team: 'minion',
  icon: 'shovel',
  nightOrder: 8,
  chaos: 82,
  shouldWake: (game, player) =>
    isAlive(player) || canActWhileDeadUnderVigormortis(game, player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ game, state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('pit_hag', language)
    const [phase, setPhase] = useState<'select_player' | 'select_role'>('select_player')
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const target = state.players.find((candidate) => candidate.id === selectedPlayerId) ?? null
    const scriptRoles = getRolesForGame(game)

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
                  <Icon name='shovel' size='3xl' className='text-red-400 text-glow-red' />
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
              roles={scriptRoles}
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
              onClick={() => {
                if (!target || !selectedRoleId) return
                const transformation = buildTransformationStateChanges(state, {
                  kind: 'role_change',
                  source: {
                    cause: 'pit_hag_change',
                    playerId: player.id,
                    roleId: 'pit_hag',
                  },
                  targets: [
                    {
                      playerId: target.id,
                      newRoleId: selectedRoleId,
                      reveal: 'pending',
                      includeNewRoleInitialEffects: true,
                    },
                  ],
                })
                onComplete({
                  entries: [
                    {
                      type: 'night_action',
                      message: [
                        { type: 'text', content: `${player.name} changed ` },
                        { type: 'player', playerId: target.id },
                        { type: 'text', content: ` into ${getRoleName(selectedRoleId, language)}.` },
                      ],
                      data: {
                        roleId: 'pit_hag',
                        playerId: player.id,
                        action: 'pit_hag_change',
                        targetId: target.id,
                        newRoleId: selectedRoleId,
                      },
                    },
                    ...(transformation.entries ?? []),
                  ],
                  addEffects: transformation.addEffects,
                  removeEffects: transformation.removeEffects,
                  changeAlignments: transformation.changeAlignments,
                  changeRoles: transformation.changeRoles,
                })
              }}
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
              <Icon name='shovel' size='3xl' className='text-red-400 text-glow-red' />
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
            players={state.players}
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
