import { EffectDefinition } from '../../types'
import { DayActionDefinition } from '../../../pipeline/types'
import { hasEffect, isAlive } from '../../../types'
import { MadnessDayActionAdapter } from '../../../../components/screens/MadnessDayActionAdapter'

const MadnessBreakPendingAction = (props: any) => (
  <MadnessDayActionAdapter {...props} effectType='madness_break_pending' />
)

const dayAction: DayActionDefinition = {
  id: 'madness_break_pending',
  icon: 'drama',
  category: 'resolution',
  getLabel: () => 'Resolve Madness',
  getDescription: () => 'Execute, quietly kill, or clear a pending madness consequence.',
  condition: (player) => isAlive(player) && hasEffect(player, 'madness_break_pending'),
  ActionComponent: MadnessBreakPendingAction,
}

const definition: EffectDefinition = {
  id: 'madness_break_pending',
  icon: 'drama',
  defaultType: 'pending',
  dayActions: [dayAction],
}

export default definition
