import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { getCurrentRoleId } from '../../../../identity'
import { getRole } from '../../../index'
import { buildTransformationStateChanges } from '../../../../transformations'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { RoleCard } from '../../../../../components/items'
import { ScreenFooter } from '../../../../../components/layouts/ScreenFooter'
import {
  HandbackButton,
  NightActionLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import { isRoleMalfunctioning } from '../helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('snake_charmer', 'en', en)
registerRoleTranslations('snake_charmer', 'es', es)

type Phase = 'select_target' | 'show_new_demon'

const definition: RoleDefinition = {
  id: 'snake_charmer',
  team: 'townsfolk',
  icon: 'fish',
  nightOrder: 19,
  chaos: 58,
  shouldWake: (_game, player) => isAlive(player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { language, t } = useI18n()
    const roleT = getRoleTranslations('snake_charmer', language)
    const [phase, setPhase] = useState<Phase>('select_target')
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
    const malfunctioning = isRoleMalfunctioning(player)
    const target = state.players.find((candidate) => candidate.id === selectedTargetId)
    const targetRoleId = target ? getCurrentRoleId(target) : undefined
    const targetRole = targetRoleId ? getRole(targetRoleId) : undefined
    const hitDemon = !malfunctioning && targetRole?.team === 'demon'

    const finalize = () => {
      if (!target) return

      const transformation = hitDemon
        ? buildTransformationStateChanges(state, {
            kind: 'role_swap',
            source: {
              cause: 'snake_charmer_swap',
              playerId: player.id,
              roleId: 'snake_charmer',
            },
            targets: [
              {
                playerId: player.id,
                newRoleId: getCurrentRoleId(target),
                reveal: 'immediate',
                includeNewRoleInitialEffects: true,
              },
              {
                playerId: target.id,
                newRoleId: 'snake_charmer',
                reveal: 'pending',
                queuePolicy: 'skip_if_window_passed',
                addEffects: [{ type: 'poisoned', expiresAt: 'never' }],
              },
            ],
          })
        : undefined

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} charmed ${target.name}${hitDemon ? ' and swapped roles.' : '.'}`,
              },
            ],
            data: {
              roleId: 'snake_charmer',
              playerId: player.id,
              action: 'snake_charmer_choice',
              targetId: target.id,
              hitDemon,
              malfunctioned: malfunctioning || undefined,
            },
          },
          ...(transformation?.entries ?? []),
        ],
        addEffects: transformation?.addEffects,
        removeEffects: transformation?.removeEffects,
        changeAlignments: transformation?.changeAlignments,
        changeRoles: transformation?.changeRoles,
      })
    }

    const handleConfirmChoice = () => {
      if (!target) return
      if (hitDemon) {
        setPhase('show_new_demon')
        return
      }
      finalize()
    }

    if (phase === 'show_new_demon' && target && targetRoleId && targetRole) {
      const revealedPlayer = { ...player, roleId: targetRoleId }

      return (
        <PlayerFacingScreen playerName={player.name}>
          <NightActionLayout
            player={revealedPlayer}
            title={t.game.yourRoleHasChanged}
            description={roleT.description}
          >
            <div className='mb-6 flex justify-center'>
              <RoleCard roleId={targetRole.id} />
            </div>

            <HandbackButton
              onClick={finalize}
              fullWidth
              size='lg'
              variant='evil'
            >
              {t.common.continue}
            </HandbackButton>
          </NightActionLayout>
        </PlayerFacingScreen>
      )
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
          <div className='px-4 py-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-20 h-20 rounded-full flex items-center justify-center border bg-indigo-500/10 border-indigo-400/30'>
                <Icon name='fish' size='3xl' className='text-indigo-400' />
              </div>
            </div>
            <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-1'>
              {roleT.chooseTargetTitle}
            </h1>
            <p className='text-parchment-400 text-sm max-w-sm mx-auto'>
              {roleT.chooseTargetDescription}
            </p>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <PlayerPickerList
              players={state.players.filter((candidate) => candidate.id !== player.id)}
              selected={selectedTargetId ? [selectedTargetId] : []}
              onSelect={(playerId) => setSelectedTargetId(playerId)}
              selectionCount={1}
              variant='blue'
            />
          </div>
          <ScreenFooter borderColor='border-indigo-500/30'>
            <Button
              onClick={handleConfirmChoice}
              disabled={!selectedTargetId}
              fullWidth
              size='lg'
              variant='primary'
            >
              {roleT.confirmChoiceLabel}
            </Button>
          </ScreenFooter>
        </div>
      </PlayerFacingScreen>
    )
  },
}

export default definition
