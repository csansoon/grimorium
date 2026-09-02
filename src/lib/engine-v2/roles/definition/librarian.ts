import { createPairedRoleSignalDefinition } from './pairedRoleSignal'

export const librarianRole = createPairedRoleSignalDefinition({
  id: 'librarian',
  roleTeam: 'townsfolk',
  targetTeam: 'outsider',
  title: 'Librarian',
  noTargetSummary: 'There are no Outsiders in play.',
  roleChoiceTitle: 'Choose Librarian role',
  roleChoiceMessage: 'Choose the Outsider role the Librarian will learn about.',
  decoyChoiceTitle: 'Choose Librarian decoy',
  decoyChoiceMessagePrefix: 'Choose the second player to show alongside',
  packetTitle: 'Librarian',
  packetSummaryPrefix: 'One of these players is',
})
