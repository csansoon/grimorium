const es = {
  name: 'Gemelo Malvado',
  description: 'Tu y un jugador opuesto os conoceis. Si ejecutan al gemelo bueno, gana el mal. Si te ejecutan a ti, gana el bien.',
  quote: 'Dos caras, una verdad, y ambas juraran que la otra la robo.',
  lines: [
    { type: 'SETUP', text: 'Tu y un jugador bueno quedais enlazados como gemelos.' },
    { type: 'WIN', text: 'Si ejecutan al gemelo bueno, gana el mal. Si ejecutan al malvado, gana el bien.' },
    { type: 'INFO', text: 'Ambos gemelos saben quien es el otro.' },
  ],
  setupTitle: 'Elige al Gemelo Bueno',
  setupDescription: 'Selecciona al jugador bueno enlazado con el Gemelo Malvado.',
  setupConfirm: 'Enlazar gemelos',
} as const

export default es
