const en = {
  name: 'Librarian',
  description:
    'You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)',

  // NightAction UI
  librarianInfo: 'Your Information',
  mustIncludeOutsider: 'At least one selected player must be an Outsider',
  oneOfTheseIsTheOutsider:
    'One of these players is an Outsider. Remember who they are!',
  noOutsidersInGame: 'No Outsiders',
  noOutsidersMessage:
    'There are no Outsiders in this game. This is valuable information!',
  confirmNoOutsiders: 'Show to Player',
  showNoOutsiders: 'Show "No Outsiders" instead',

  // History
  history: {
    discoveredOutsider:
      '{player} discovered that either {player1} or {player2} is the {role}',
    noOutsiders: '{player} learned there are no Outsiders in this game',
  },
} as const

export default en
