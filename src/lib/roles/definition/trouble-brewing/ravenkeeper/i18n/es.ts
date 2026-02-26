const es = {
  name: 'Guardacuervos',
  description:
    'Si mueres de noche, te despiertan para elegir un jugador: descubres su personaje.',

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
