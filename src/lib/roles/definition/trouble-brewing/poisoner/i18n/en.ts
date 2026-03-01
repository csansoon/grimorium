const en = {
  name: 'Poisoner',
  description: 'Each night, choose a player: they are poisoned tonight.',
  quote: 'A little patience, a little powder. No one ever suspects the cook.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose a player to poison until the next dusk.' },
    { type: 'CAVEAT', text: 'Poisoned players\' abilities malfunction and produce false information, without them knowing.' },
    { type: 'TEAM', text: 'You know who the Demon is.' },
    { type: 'WIN', text: 'Keep your Demon alive to win.' },
  ],

  // NightAction UI
  info: 'Choose a Target',
  selectPlayerToPoison:
    'Wake {player} and ask them to point to a player to poison. Their ability will malfunction until the end of the next day.',

  // First night: evil team
  evilTeamTitle: 'Your Evil Team',
  evilTeamDescription: 'These are your fellow evil players.',

  // History
  history: {
    poisonedPlayer: '{player} poisoned {target}',
    shownEvilTeam: '{player} was shown the evil team',
  },
} as const

export default en
