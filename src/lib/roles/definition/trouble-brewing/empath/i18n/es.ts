const es = {
  name: 'Empático',
  description:
    'Cada noche, descubres cuántos de tus 2 vecinos vivos son malvados.',

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
