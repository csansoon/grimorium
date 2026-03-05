import { useMemo, useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { getRolesForGame } from '../../../index'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { RolePickerGrid } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { ScreenFooter } from '../../../../../components/layouts/ScreenFooter'
import { PlayerFacingScreen } from '../../../../../components/layouts/PlayerFacingScreen'
import { GOOD_ROLE_IDS } from '../helpers'
import { buildTransformationStateChanges } from '../../../../transformations'
import {
  TransformationQueuePolicy,
} from '../../../../transformations'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('philosopher', 'en', en)
registerRoleTranslations('philosopher', 'es', es)

export function getPhilosopherQueuePolicyForChosenRole(
  role: RoleDefinition,
): TransformationQueuePolicy | undefined {
  if (!role.NightAction) return undefined
  return 'act_immediately_force'
}

const definition: RoleDefinition = {
  id: 'philosopher',
  team: 'townsfolk',
  icon: 'bookUser',
  nightOrder: 20,
  chaos: 70,
  shouldWake: (_game, player) => isAlive(player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ game, state, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('philosopher', language)
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const goodRoles = useMemo(
      () =>
        getRolesForGame(game).filter(
          (role) =>
            GOOD_ROLE_IDS.has(role.id) &&
            role.id !== 'philosopher',
        ),
      [game],
    )

    const complete = () => {
      if (!selectedRoleId) return
      const selectedRole = goodRoles.find((role) => role.id === selectedRoleId)
      if (!selectedRole) return
      const drunkTarget = state.players.find(
        (candidate) =>
          candidate.id !== player.id && candidate.roleId === selectedRoleId,
      )
      const transformation = buildTransformationStateChanges(state, {
        kind: 'role_change',
        source: {
          cause: 'philosopher_choice',
          playerId: player.id,
          roleId: 'philosopher',
        },
        targets: [
          {
            playerId: player.id,
            newRoleId: selectedRoleId,
            reveal: 'pending',
            queuePolicy: getPhilosopherQueuePolicyForChosenRole(selectedRole),
            includeNewRoleInitialEffects: true,
          },
        ],
      })

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} chose to gain the ability of ${selectedRoleId}.`,
              },
            ],
            data: {
              roleId: 'philosopher',
              playerId: player.id,
              action: 'philosopher_choice',
              chosenRoleId: selectedRoleId,
              drunkTargetId: drunkTarget?.id,
            },
          },
          ...(transformation.entries ?? []),
        ],
        changeAlignments: transformation.changeAlignments,
        changeRoles: transformation.changeRoles,
        addEffects: {
          ...transformation.addEffects,
          ...(drunkTarget
            ? {
                [drunkTarget.id]: [
                  {
                    type: 'drunk',
                    data: {
                      source: 'philosopher',
                      philosopherId: player.id,
                      chosenRoleId: selectedRoleId,
                    },
                    sourcePlayerId: player.id,
                    expiresAt: 'never',
                  },
                ],
              }
            : {}),
        },
        removeEffects: transformation.removeEffects,
      })
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
          <div className='px-4 py-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-20 h-20 rounded-full flex items-center justify-center border bg-indigo-500/10 border-indigo-400/30'>
                <Icon name='bookUser' size='3xl' className='text-indigo-400' />
              </div>
            </div>
            <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-1'>
              {roleT.chooseAbilityTitle}
            </h1>
            <p className='text-parchment-400 text-sm max-w-sm mx-auto'>
              {roleT.chooseAbilityDescription}
            </p>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <RolePickerGrid
              roles={goodRoles}
              state={state}
              selected={selectedRoleId ? [selectedRoleId] : []}
              onSelect={(roleId) =>
                setSelectedRoleId((prev) => (prev === roleId ? null : roleId))
              }
              selectionCount={1}
              colorMode='team'
            />
          </div>
          <ScreenFooter borderColor='border-indigo-500/30'>
            <div className='flex w-full gap-3'>
              <Button
                onClick={() =>
                  onComplete({
                    entries: [
                      {
                        type: 'night_skipped',
                        message: [],
                        data: {
                          roleId: 'philosopher',
                          playerId: player.id,
                          action: 'wait',
                        },
                      },
                    ],
                  })
                }
                fullWidth
                size='lg'
                variant='secondary'
              >
                {roleT.waitLabel}
              </Button>
              <Button
                onClick={complete}
                disabled={!selectedRoleId}
                fullWidth
                size='lg'
                variant='primary'
              >
                {roleT.confirmChoiceLabel}
              </Button>
            </div>
          </ScreenFooter>
        </div>
      </PlayerFacingScreen>
    )
  },
}

export default definition
