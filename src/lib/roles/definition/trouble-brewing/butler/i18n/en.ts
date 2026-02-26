const en = {
  name: 'Butler',
  description:
    'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',

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
