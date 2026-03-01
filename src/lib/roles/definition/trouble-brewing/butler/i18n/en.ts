const en = {
  name: 'Butler',
  description:
    'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
  quote: 'I serve at the pleasure of my master. They say when I speak.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose a player to become your master for the day.' },
    { type: 'CAVEAT', text: 'You may only vote on executions if your master votes too.' },
    { type: 'ADVICE', text: 'You can abstain from voting even if your master votes.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // NightAction UI
  info: 'Choose Your Master',
  selectPlayerAsMaster:
    'Wake {player} and ask them to point to a player to be their master. Tomorrow, they may only vote if their master votes too.',
  masterLabel: 'Master: {player}',
  voteRestriction: 'May only vote if their master votes',

  // History
  history: {
    choseMaster: '{player} chose {target} as their master',
  },
} as const

export default en
