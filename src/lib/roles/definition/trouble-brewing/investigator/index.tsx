import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import { registerRoleTranslations } from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import {
  InfoRoleNightAction,
  InfoRoleConfig,
} from '../../../../../components/night_steps/InfoRoleNightAction'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('investigator', 'en', en)
registerRoleTranslations('investigator', 'es', es)

const investigatorConfig: InfoRoleConfig = {
  roleId: 'investigator',
  icon: 'search',
  targetTeam: 'minion',
  historyKeys: {
    discovered: 'roles.investigator.history.discoveredMinion',
    noTarget: 'roles.investigator.history.noMinions',
  },
  getLabels: (roleT) => ({
    infoTitle: roleT.investigatorInfo,
    noTargetTitle: roleT.noMinionsInGame,
    noTargetMessage: roleT.noMinionsMessage,
    noTargetConfirm: roleT.confirmNoMinions,
    showNoTargetLink: roleT.showNoMinions,
    mustIncludeTarget: roleT.mustIncludeMinion,
  }),
}

const definition: RoleDefinition = {
  id: 'investigator',
  team: 'townsfolk',
  icon: 'search',
  nightOrder: 12,
  chaos: 15,
  shouldWake: (game, player) =>
    isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: (props) => (
    <InfoRoleNightAction config={investigatorConfig} {...props} />
  ),
}

export default definition
