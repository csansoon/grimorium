const es = {
  name: 'Empático',
  description:
    'Cada noche, descubres cuántos de tus 2 vecinos vivos son malvados.',
  quote: 'Siento el peso de sus pecados, incluso cuando sonríen.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, descubres cuántos de tus vecinos vivos son malvados.' },
    { type: 'INFO', text: 'Solo cuentan tus dos vecinos vivos más cercanos, saltando jugadores muertos.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // NightAction UI
  info: 'Tu Información',
  evilNeighborsCount: 'Vecinos malvados:',
  evilNeighborsExplanation:
    'Este es el número de jugadores malvados sentados inmediatamente a tu lado entre los jugadores vivos.',

  // History
  history: {
    sawEvilNeighbors:
      '{player} descubrió que {count} de sus vecinos son malvados',
  },
} as const

export default es
