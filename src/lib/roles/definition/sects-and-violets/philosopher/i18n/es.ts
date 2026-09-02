const es = {
  name: 'Filosofo',
  description: 'Una vez por partida, por la noche, elige un personaje bueno: ganas esa habilidad. Si esta en juego, queda borracho.',
  quote: 'Cada pregunta respondida crea otra mejor detras de ella.',
  lines: [
    { type: 'ONCE', text: 'Una vez por partida, por la noche, elige un personaje bueno.' },
    { type: 'GAIN', text: 'Ganas esa habilidad para el resto de la partida.' },
    { type: 'CAVEAT', text: 'Si ese personaje esta en juego, se vuelve borracho.' },
  ],
  chooseAbilityTitle: 'Elige una Habilidad Buena',
  chooseAbilityDescription: 'Selecciona el personaje bueno cuya habilidad quieres ganar.',
  confirmChoiceLabel: 'Ganar habilidad',
  waitLabel: 'No esta noche',
} as const

export default es
