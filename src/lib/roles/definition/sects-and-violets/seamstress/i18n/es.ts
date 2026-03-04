const es = {
  name: 'Costurera',
  description: 'Una vez por partida, de noche, elige 2 jugadores: aprendes si tienen la misma alineacion.',
  quote: 'Las mejores puntadas unen dos verdades con un solo hilo.',
  lines: [
    { type: 'ONCE', text: 'Una vez por partida, de noche, elige 2 jugadores.' },
    { type: 'INFO', text: 'Aprendes si comparten la misma alineacion.' },
    { type: 'WIN', text: 'Guardala para el momento en que una comparacion importe de verdad.' },
  ],
  chooseTitle: 'Elige Dos Jugadores',
  chooseDescription: 'Selecciona los dos jugadores que quieres comparar esta noche.',
  confirmChoiceLabel: 'Mostrar resultado',
  waitLabel: 'No esta noche',
  infoTitle: 'Costurera',
  question: '{first} y {second} tienen la misma alineacion?',
  sameLabel: 'Igual',
  differentLabel: 'Distinta',
  configureTitle: 'Configurar Costurera',
  configureDescription: 'Elige la respuesta para {first} y {second} si la Costurera esta afectada.',
} as const

export default es
