import { EffectDefinition } from '../../types'
import {
  DayActionDefinition,
  DayActionProps,
  DayActionResult,
  NightFollowUpDefinition,
  NightFollowUpProps,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'
import { buildTransformationStateChanges } from '../../../transformations'
import { StorytellerChoiceScreen } from '../../../../components/screens/SectsAndVioletsActionScreens'

function buildSwapResult(
  state: DayActionProps['state'],
  barberId: string,
  [firstId, secondId]: string[],
): Pick<
  DayActionResult,
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
    removeEffects: {
      ...transformation.removeEffects,
      [barberId]: ['barber_swap_pending'],
    },
  }
}

function BarberResolution({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  return (
    <StorytellerChoiceScreen
      state={state}
      icon='shuffle'
      title='Barber'
      description='Choose two players to swap characters.'
      confirmLabel='Swap these characters'
      players={state.players}
      selectionCount={2}
      onBack={onBack}
      onConfirm={(selectedIds) => {
        const result = buildSwapResult(state, playerId, selectedIds)
        if (result) onComplete(result)
      }}
    />
  )
}

function BarberNightFollowUp({
  state,
  playerId,
  onComplete,
}: NightFollowUpProps) {
  return (
    <StorytellerChoiceScreen
      state={state}
      icon='shuffle'
      title='Barber'
      description='Choose two players to swap characters.'
      confirmLabel='Swap these characters'
      players={state.players}
      selectionCount={2}
      onConfirm={(selectedIds) => {
        const result = buildSwapResult(state, playerId, selectedIds)
        if (result) onComplete(result)
      }}
    />
  )
}

const dayAction: DayActionDefinition = {
  id: 'barber_swap',
  icon: 'shuffle',
  category: 'resolution',
  getLabel: () => 'Resolve Barber',
  getDescription: () => 'Choose two players to swap after Barber dies.',
  condition: (player) => hasEffect(player, 'barber_swap_pending'),
  ActionComponent: BarberResolution,
}

const nightFollowUp: NightFollowUpDefinition = {
  id: 'barber_swap',
  icon: 'shuffle',
  getLabel: () => 'Resolve Barber',
  condition: (player) => hasEffect(player, 'barber_swap_pending'),
  ActionComponent: BarberNightFollowUp,
}

const definition: EffectDefinition = {
  id: 'barber_swap_pending',
  icon: 'shuffle',
  defaultType: 'pending',
  dayActions: [dayAction],
  nightFollowUps: [nightFollowUp],
}

export default definition
