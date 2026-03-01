const es = {
  name: 'Mujer Escarlata',
  description:
    'Si hay 5 o más jugadores vivos y el Demonio muere, tú te conviertes en el Demonio.',
  quote: 'Cuando el trono caiga, yo ya llevaré la corona.',
  lines: [
    { type: 'PASSIVE', text: 'Si el Demonio muere y quedan 5+ jugadores vivos, te conviertes en el nuevo Demonio.' },
    { type: 'TEAM', text: 'Sabes quién es el Demonio.' },
    { type: 'WIN', text: 'Un Demonio debe permanecer vivo para ganar.' },
  ],

  // First night: evil team
  evilTeamTitle: 'Tu Equipo Malvado',
  evilTeamDescription: 'Estos son tus compañeros malvados.',

  // History
  history: {
    becameDemon: '{player} se convirtió en el/la {role}',
    shownEvilTeam: '{player} vio al equipo malvado',
  },
} as const

export default es
