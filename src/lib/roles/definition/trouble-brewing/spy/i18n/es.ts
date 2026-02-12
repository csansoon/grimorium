const es = {
  name: 'Espía',
  description:
    'Cada noche, puedes mirar el Grimorio. Podrías registrarte como bueno y como un Aldeano o Forastero, incluso estando muerto.',

  // NightAction UI
  spyGrimoireTitle: 'El Grimorio',
  spyGrimoireDescription: 'Puedes ver a todos los jugadores y sus roles.',
  spyMalfunctionTitle: 'El Grimorio',
  spyMalfunctionDescription:
    'El Espía está fallando — no muestres el Grimorio real.',

  // First night: evil team
  evilTeamTitle: 'Tu Equipo Malvado',
  evilTeamDescription: 'Estos son tus compañeros malvados.',

  // History
  history: {
    viewedGrimoire: '{player} miró el Grimorio',
  },
} as const

export default es
