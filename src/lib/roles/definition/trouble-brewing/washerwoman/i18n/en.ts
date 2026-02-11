const en = {
  name: 'Washerwoman',
  description:
    'You start knowing that 1 of 2 players is a particular Townsfolk.',

  // NightAction UI
  washerwomanInfo: 'Your Information',
  mustIncludeTownsfolk: 'At least one selected player must be a Townsfolk',
  oneOfTheseIsTheTownsfolk:
    'One of these players is a Townsfolk. Remember who they are!',

  // History
  history: {
    discoveredTownsfolk:
      '{player} discovered that either {player1} or {player2} is the {role}',
  },
} as const

export default en
