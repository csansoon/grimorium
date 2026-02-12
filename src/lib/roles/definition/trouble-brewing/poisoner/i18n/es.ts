const es = {
  name: 'Envenenador',
  description: 'Cada noche, elige un jugador: está envenenado esta noche.',

  // NightAction UI
  info: 'Elige un Objetivo',
  selectPlayerToPoison:
    'Selecciona un jugador para envenenar esta noche. Su habilidad fallará.',

  // First night: evil team
  evilTeamTitle: 'Tu Equipo Malvado',
  evilTeamDescription: 'Estos son tus compañeros malvados.',

  // History
  history: {
    poisonedPlayer: '{player} envenenó a {target}',
    shownEvilTeam: '{player} vio al equipo malvado',
  },
} as const

export default es
