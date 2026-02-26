const es = {
  name: 'Envenenador',
  description: 'Cada noche, elige un jugador: está envenenado esta noche.',

  // NightAction UI
  info: 'Elige un Objetivo',
  selectPlayerToPoison:
    'Despierta a {player} y pídele que señale a un jugador para envenenar. Su habilidad fallará hasta el final del próximo día.',

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
