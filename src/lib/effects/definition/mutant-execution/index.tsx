import { EffectDefinition } from '../../types'
import { DayActionDefinition } from '../../../pipeline/types'
import { isAlive } from '../../../types'
import { MadnessDayActionAdapter } from '../../../../components/screens/MadnessDayActionAdapter'

const MutantExecutionAction = (props: any) => (
  <MadnessDayActionAdapter {...props} effectType='mutant_execution' />
)

const dayAction: DayActionDefinition = {
  id: 'mutant_execution',
  icon: 'zapOff',
  getLabel: () => 'Execute Mutant',
  getDescription: () => 'Open the shared madness flow for this Mutant.',
  condition: (player) => isAlive(player),
  ActionComponent: MutantExecutionAction,
}

const definition: EffectDefinition = {
  id: 'mutant_execution',
  icon: 'zapOff',
  defaultType: 'passive',
  madnessResolution: {
    buildActiveEntry: (player) => {
      if (player.roleId !== 'mutant') return null

      return {
        icon: 'zapOff',
        sourceRoleId: 'mutant',
        title: 'Mutant madness',
        description: `${player.name} can be marked as having broken Mutant madness.`,
      }
    },
    buildPendingEntry: (player) => ({
      icon: 'zapOff',
      sourceRoleId: 'mutant',
      title: 'Pending Mutant madness',
      description: `${player.name} has a deferred Mutant madness consequence waiting.`,
    }),
  },
  persistence: {
    targetRoleChange: 'remove',
  },
  dayActions: [dayAction],
}

export default definition
