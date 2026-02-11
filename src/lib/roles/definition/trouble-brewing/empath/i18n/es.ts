const es = {
  name: 'Empático',
  description:
    'Cada noche, descubres cuántos de tus 2 vecinos vivos son malvados.',

  // NightAction UI
  info: 'Tu Información',
  evilNeighborsCount: 'Vecinos malvados:',
  evilNeighborsExplanation:
    'Este es cuántos de tus vecinos vivos son malvados.',

  // History
  history: {
    sawEvilNeighbors:
      '{player} descubrió que {count} de sus vecinos son malvados',
  },
} as const

export default es
