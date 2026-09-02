import { createPairedRoleSignalDefinition } from './pairedRoleSignal'

export const washerwomanRole = createPairedRoleSignalDefinition({
  id: 'washerwoman',
  roleTeam: 'townsfolk',
  targetTeam: 'townsfolk',
  title: 'Washerwoman',
  noTargetSummary: 'There are no Townsfolk in play.',
  roleChoiceTitle: 'Choose Washerwoman role',
  roleChoiceMessage: 'Choose the Townsfolk role the Washerwoman will learn about.',
  decoyChoiceTitle: 'Choose Washerwoman decoy',
  decoyChoiceMessagePrefix: 'Choose the second player to show alongside',
  packetTitle: 'Washerwoman',
  packetSummaryPrefix: 'One of these players is',
})
