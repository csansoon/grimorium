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

registerRoleTranslations('librarian', 'en', en)
registerRoleTranslations('librarian', 'es', es)

const librarianConfig: InfoRoleConfig = {
  roleId: 'librarian',
  icon: 'bookMarked',
  targetTeam: 'outsider',
  historyKeys: {
    discovered: 'roles.librarian.history.discoveredOutsider',
    noTarget: 'roles.librarian.history.noOutsiders',
  },
  getLabels: (roleT) => ({
    infoTitle: roleT.librarianInfo,
    noTargetTitle: roleT.noOutsidersInGame,
    noTargetMessage: roleT.noOutsidersMessage,
    noTargetConfirm: roleT.confirmNoOutsiders,
    showNoTargetLink: roleT.showNoOutsiders,
    mustIncludeTarget: roleT.mustIncludeOutsider,
  }),
}

const definition: RoleDefinition = {
  id: 'librarian',
  team: 'townsfolk',
  icon: 'bookMarked',
  nightOrder: 11,
  chaos: 15,
  shouldWake: (game, player) =>
    isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: (props) => (
    <InfoRoleNightAction config={librarianConfig} {...props} />
  ),
}

export default definition
