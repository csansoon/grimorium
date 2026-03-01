const en = {
  name: 'Washerwoman',
  description:
    'You start knowing that 1 of 2 players is a particular Townsfolk.',
  quote: 'Even the dirtiest linens leave traces of who wore them.',
  lines: [
    { type: 'NIGHT', text: 'On the first night, you learn 2 players and 1 Townsfolk role — one of those players holds that role.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

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
