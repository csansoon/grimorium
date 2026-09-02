import { createPairedRoleSignalDefinition } from './pairedRoleSignal'

export const investigatorRole = createPairedRoleSignalDefinition({
  id: 'investigator',
  roleTeam: 'townsfolk',
  targetTeam: 'minion',
  title: 'Investigator',
  noTargetSummary: 'There are no Minions in play.',
  roleChoiceTitle: 'Choose Investigator role',
  roleChoiceMessage: 'Choose the Minion role the Investigator will learn about.',
  decoyChoiceTitle: 'Choose Investigator decoy',
  decoyChoiceMessagePrefix: 'Choose the second player to show alongside',
  packetTitle: 'Investigator',
  packetSummaryPrefix: 'One of these players is',
})
