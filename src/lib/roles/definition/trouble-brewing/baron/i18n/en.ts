const en = {
  name: 'Baron',
  description: 'There are extra Outsiders in play. [+2 Outsiders]',
  quote: 'Corruption starts at the top. It trickles down from there.',
  lines: [
    { type: 'SETUP', text: 'Two extra Outsiders are added to the game, replacing Townsfolk.' },
    { type: 'ADVICE', text: 'More Outsiders means more chaos.' },
    { type: 'TEAM', text: 'You know who the Demon is.' },
    { type: 'WIN', text: 'Keep a Demon alive to win.' },
  ],

  // First night: evil team
  evilTeamTitle: 'Your Evil Team',
  evilTeamDescription: 'These are your fellow evil players.',

  // History
  history: {
    shownEvilTeam: '{player} was shown the evil team',
  },
} as const

export default en
