const es = {
  name: 'Guardacuervos',
  description:
    'Si mueres de noche, te despiertan para elegir un jugador: descubres su personaje.',
  quote: 'Mi último aliento no será en vano. Alguien será nombrado.',
  lines: [
    { type: 'ON_DEATH', text: 'Si mueres de noche, despiertas para elegir cualquier jugador y descubrir su rol.' },
    { type: 'INFO', text: 'Solo funciona si mueres de noche, no por ejecución.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // NightAction UI
  ravenkeeperInfo: 'Elige un Jugador',
  selectPlayerToSeeRole:
    'Despierta a {player} y pídele que señale a un jugador para conocer su rol.',
  playerRoleIs: 'Su rol es...',

  // History
  history: {
    sawRole: '{player} eligió ver el rol de {target}: {role}',
  },
} as const

export default es
