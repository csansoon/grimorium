const es = {
  name: 'Mayordomo',
  description:
    'Cada noche, elige un jugador (no tú): mañana, solo puedes votar si ellos también están votando.',
  quote: 'Sirvo a voluntad de mi amo. Él decide cuándo puedo hablar.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador para que sea tu amo.' },
    { type: 'CAVEAT', text: 'Solo puedes votar en ejecuciones si tu amo también vota.' },
    { type: 'ADVICE', text: 'Puedes abstenerte de votar incluso si tu amo vota.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // NightAction UI
  info: 'Elige a tu Amo',
  selectPlayerAsMaster:
    'Despierta a {player} y pídele que señale a un jugador para que sea su amo. Mañana, solo podrá votar si su amo vota.',
  masterLabel: 'Amo: {player}',
  voteRestriction: 'Solo puede votar si su amo vota',

  // History
  history: {
    choseMaster: '{player} eligió a {target} como su amo',
  },
} as const

export default es
