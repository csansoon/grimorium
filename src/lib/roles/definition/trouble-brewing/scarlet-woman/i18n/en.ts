const en = {
  name: 'Scarlet Woman',
  description:
    'If there are 5 or more players alive & the Demon dies, you become the Demon.',
  quote: 'When the throne falls, I will already be wearing the crown.',
  lines: [
    { type: 'PASSIVE', text: 'If the Demon dies and 5+ players are alive, you become the new Demon.' },
    { type: 'TEAM', text: 'You know who the Demon is.' },
    { type: 'WIN', text: 'Keep a Demon alive to win.' },
  ],

  // First night: evil team
  evilTeamTitle: 'Your Evil Team',
  evilTeamDescription: 'These are your fellow evil players.',

  // History
  history: {
    becameDemon: '{player} became the {role}',
    shownEvilTeam: '{player} was shown the evil team',
  },
} as const

export default en
