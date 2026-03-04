const es = {
  name: 'Encantador de Serpientes',
  description: 'Cada noche, elige un jugador vivo: un Demonio elegido intercambia personajes y alineaciones contigo, y luego queda envenenado.',
  quote: 'El truco no esta en encantar a la serpiente. Esta en sobrevivir a la mordida.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador vivo.' },
    { type: 'SWAP', text: 'Si eliges al Demonio, intercambiais roles y alineaciones, y el queda envenenado.' },
    { type: 'WIN', text: 'Un acierto afortunado puede cambiar la partida en plena noche.' },
  ],
  chooseTargetTitle: 'Elige un Jugador Vivo',
  chooseTargetDescription: 'Selecciona al jugador que quieres encantar esta noche.',
  confirmChoiceLabel: 'Confirmar eleccion',
} as const

export default es
