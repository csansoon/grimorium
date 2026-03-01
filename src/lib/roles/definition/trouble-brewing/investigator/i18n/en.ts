const en = {
  name: 'Investigator',
  description: 'You start knowing that 1 of 2 players is a particular Minion.',
  quote: 'Follow the money. Follow the whispers. Follow the fear.',
  lines: [
    { type: 'NIGHT', text: 'In the first night, you learn 2 players and 1 Minion role — one of those players holds that role.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // NightAction UI
  investigatorInfo: 'Your Information',
  mustIncludeMinion: 'At least one selected player must be a Minion',
  oneOfTheseIsTheMinion:
    'One of these players is a Minion. Remember who they are!',
  noMinionsInGame: 'No Minions',
  noMinionsMessage:
    'There are no Minions in this game. This is valuable information!',
  confirmNoMinions: 'Show to Player',
  showNoMinions: 'Show "No Minions" instead',

  // History
  history: {
    discoveredMinion:
      '{player} discovered that either {player1} or {player2} is the {role}',
    noMinions: '{player} learned there are no Minions in this game',
  },
} as const

export default en
