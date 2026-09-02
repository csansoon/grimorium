import { EffectDefinition } from '../../types'
import { DayActionDefinition } from '../../../pipeline/types'
import { hasEffect, isAlive } from '../../../types'
import { getRoleName } from '../../../i18n'
import type { Language } from '../../../i18n'
import { MadnessDayActionAdapter } from '../../../../components/screens/MadnessDayActionAdapter'

const CerenovusMadnessAction = (props: any) => (
  <MadnessDayActionAdapter {...props} effectType='cerenovus_madness' />
)

const dayAction: DayActionDefinition = {
  id: 'cerenovus_madness',
  icon: 'drama',
  getLabel: () => 'Resolve Cerenovus',
  getDescription: () => 'Open the shared madness flow for this player.',
  condition: (player) => isAlive(player) && hasEffect(player, 'cerenovus_madness'),
  ActionComponent: CerenovusMadnessAction,
}

const definition: EffectDefinition = {
  id: 'cerenovus_madness',
  icon: 'drama',
  defaultType: 'pending',
  madnessResolution: {
    buildActiveEntry: (player, instance, language) => {
      const madAsRoleId =
        typeof instance.data?.madAsRoleId === 'string'
          ? instance.data.madAsRoleId
          : undefined

      return {
        icon: 'drama',
        sourceRoleId: 'cerenovus',
        title: 'Cerenovus madness',
        description: madAsRoleId
          ? `${player.name} is currently mad as ${getRoleName(madAsRoleId, language as Language)}.`
          : `${player.name} is currently under Cerenovus madness.`,
        madAsRoleId,
      }
    },
    buildPendingEntry: (player, input, language) => ({
      icon: 'drama',
      sourceRoleId: input.sourceRoleId ?? 'cerenovus',
      title: 'Pending Cerenovus madness',
      description: input.claimRoleId
        ? `${player.name} broke Cerenovus madness while claiming ${getRoleName(input.claimRoleId, language as Language)}.`
        : `${player.name} has a deferred Cerenovus madness consequence waiting.`,
      madAsRoleId: input.claimRoleId,
    }),
  },
  dayActions: [dayAction],
}

export default definition
