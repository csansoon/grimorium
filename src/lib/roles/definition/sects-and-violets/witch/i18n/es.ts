const es = {
  name: 'Bruja',
  description: 'Cada noche, elige un jugador: si nomina mañana, muere.',
  quote: 'Una promesa de bruja es solo una maldicion con mejores modales.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador.' },
    { type: 'CAVEAT', text: 'Si nomina durante el siguiente dia, muere.' },
    { type: 'WIN', text: 'Usa la maldicion para controlar quien se atreve a abrir nominaciones.' },
  ],
  chooseTargetTitle: 'Elige al Maldito',
  chooseTargetDescription: 'Si este jugador nomina mañana, morirá.',
  confirmChoiceLabel: 'Aplicar maldicion',
} as const

export default es
