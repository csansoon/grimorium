import { EffectDefinition } from '../../types'
import {
  NightFollowUpResult,
  NightFollowUpDefinition,
  NightFollowUpProps,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'
import { getCurrentRoleTeam } from '../../../identity'
import { buildTransformationStateChanges } from '../../../transformations'
import { StorytellerChoiceScreen } from '../../../../components/screens/SectsAndVioletsActionScreens'

function buildSwapResult(
  state: NightFollowUpProps['state'],
  barberId: string,
  [firstId, secondId]: string[],
): Pick<
  NightFollowUpResult,
  'entries' | 'changeRoles' | 'addEffects' | 'removeEffects'
> | null {
  const first = state.players.find((player) => player.id === firstId)
  const second = state.players.find((player) => player.id === secondId)
  if (!first || !second) return null

  const transformation = buildTransformationStateChanges(state, {
    kind: 'role_swap',
    source: {
      cause: 'barber_swap',
      playerId: barberId,
      roleId: 'barber',
    },
    targets: [
      {
        playerId: firstId,
        newRoleId: second.roleId,
        reveal: 'pending',
      },
      {
        playerId: secondId,
        newRoleId: first.roleId,
        reveal: 'pending',
      },
    ],
  })

  return {
    entries: transformation.entries,
    changeRoles: transformation.changeRoles,
    addEffects: transformation.addEffects,
    removeEffects: transformation.removeEffects,
  }
}

function BarberNightFollowUp({
  state,
  playerId,
  onComplete,
}: NightFollowUpProps) {
  const demon = state.players.find((player) => player.id === playerId)
  const pending = demon?.effects.find((effect) => effect.type === 'barber_swap_pending')
  const barberId =
    typeof pending?.data?.barberId === 'string'
      ? (pending.data.barberId as string)
      : null

  const clearPending = () =>
    onComplete({
      entries: [
        {
          type: 'night_action',
          message: [
            {
              type: 'text',
              content: `${demon?.name ?? 'Demon'} chose not to swap with Barber.`,
            },
          ],
          data: {
            roleId: 'barber',
            playerId,
            action: 'barber_no_swap',
            sourcePlayerId: barberId,
          },
        },
      ],
      removeEffects: {
        [playerId]: ['barber_swap_pending'],
      },
    })

  return (
    <StorytellerChoiceScreen
      state={state}
      icon='shuffle'
      title='Barber'
      description='Wake the Demon: choose two players to swap, or skip.'
      confirmLabel='Swap'
      secondaryActionLabel='Skip'
      onSecondaryAction={clearPending}
      players={state.players}
      selectionCount={2}
      onConfirm={(selectedIds) => {
        if (!barberId) {
          clearPending()
          return
        }
        const result = buildSwapResult(state, barberId, selectedIds)
        if (!result) return
        onComplete({
          ...result,
          removeEffects: {
            ...result.removeEffects,
            [playerId]: ['barber_swap_pending'],
          },
        })
      }}
    />
  )
}

const nightFollowUp: NightFollowUpDefinition = {
  id: 'barber_swap',
  icon: 'shuffle',
  getLabel: () => 'Barber (Demon choice)',
  condition: (player) =>
    hasEffect(player, 'barber_swap_pending') && getCurrentRoleTeam(player) === 'demon',
  placement: 'before_player_action',
  ActionComponent: BarberNightFollowUp,
}

const definition: EffectDefinition = {
  id: 'barber_swap_pending',
  icon: 'shuffle',
  defaultType: 'pending',
  nightFollowUps: [nightFollowUp],
}

export default definition
