const en = {
  name: 'Investigator',
  description: 'You start knowing that 1 of 2 players is a particular Minion.',

  // NightAction UI
  investigatorInfo: 'Your Information',
  mustIncludeMinion: 'At least one selected player must be a Minion',
  oneOfTheseIsTheMinion:
    'One of these players is a Minion. Remember who they are!',

  // History
  history: {
    discoveredMinion:
      '{player} discovered that either {player1} or {player2} is the {role}',
  },
} as const

export default en
