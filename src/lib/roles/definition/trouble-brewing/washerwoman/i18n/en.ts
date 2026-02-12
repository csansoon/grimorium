const en = {
  name: 'Washerwoman',
  description:
    'You start knowing that 1 of 2 players is a particular Townsfolk.',

  // NightAction UI
  washerwomanInfo: 'Your Information',
  mustIncludeTownsfolk: 'At least one selected player must be a Townsfolk',
  oneOfTheseIsTheTownsfolk:
    'One of these players is a Townsfolk. Remember who they are!',
  noTownsfolkInGame: 'No Townsfolk',
  noTownsfolkMessage:
    'There are no other Townsfolk in this game. This is valuable information!',
  confirmNoTownsfolk: 'Show to Player',
  showNoTownsfolk: 'Show "No Townsfolk" instead',

  // History
  history: {
    discoveredTownsfolk:
      '{player} discovered that either {player1} or {player2} is the {role}',
    noTownsfolk: '{player} learned there are no other Townsfolk in this game',
  },
} as const

export default en
