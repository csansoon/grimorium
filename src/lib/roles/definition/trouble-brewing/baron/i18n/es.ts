const es = {
  name: 'Barón',
  description: 'Hay Forasteros extra en juego. [+2 Forasteros]',
  quote: 'La corrupción empieza arriba. Desde ahí se filtra.',
  lines: [
    { type: 'SETUP', text: 'Se añaden dos Forasteros extra al juego, reemplazando Aldeanos.' },
    { type: 'ADVICE', text: 'Más Forasteros significa más caos.' },
    { type: 'TEAM', text: 'Sabes quién es el Demonio.' },
    { type: 'WIN', text: 'Mantén vivo a tu Demonio para ganar.' },
  ],

  // First night: evil team
  evilTeamTitle: 'Tu Equipo Malvado',
  evilTeamDescription: 'Estos son tus compañeros malvados.',

  // History
  history: {
    shownEvilTeam: '{player} vio al equipo malvado',
  },
} as const

export default es
