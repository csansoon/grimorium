const es = {
  name: 'Envenenador',
  description: 'Cada noche, elige un jugador: está envenenado esta noche.',
  quote: 'Un poco de paciencia, un poco de polvo. Nadie sospecha del cocinero.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador para envenenar hasta el siguiente anochecer.' },
    { type: 'CAVEAT', text: 'Las habilidades de los jugadores envenenados fallan y producen información falsa, sin que lo sepan.' },
    { type: 'TEAM', text: 'Sabes quién es el Demonio.' },
    { type: 'WIN', text: 'Mantén vivo a tu Demonio para ganar.' },
  ],

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
