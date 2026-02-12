const es = {
  name: 'Mujer Escarlata',
  description:
    'Si hay 5 o más jugadores vivos y el Demonio muere, tú te conviertes en el Demonio.',

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
