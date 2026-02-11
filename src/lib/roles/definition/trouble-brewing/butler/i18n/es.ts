const es = {
  name: 'Mayordomo',
  description:
    'Cada noche, elige un jugador (no tú): mañana, solo puedes votar si ellos también están votando.',

  // NightAction UI
  info: 'Elige a tu Amo',
  selectPlayerAsMaster:
    'Selecciona un jugador como tu amo. Mañana, solo podrás votar si ellos también votan.',
  masterLabel: 'Amo: {player}',
  voteRestriction: 'Solo puede votar si su amo vota',

  // History
  history: {
    choseMaster: '{player} eligió a {target} como su amo',
  },
} as const

export default es
