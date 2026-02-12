const en = {
  name: 'Scarlet Woman',
  description:
    'If there are 5 or more players alive & the Demon dies, you become the Demon.',

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
