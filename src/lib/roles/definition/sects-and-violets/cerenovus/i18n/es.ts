const es = {
  name: 'Cerenovus',
  description: 'Cada noche, elige un jugador y un personaje bueno: mañana estará loco diciendo que es ese personaje, o podria ser ejecutado.',
  quote: 'La realidad es opcional si suficientes personas repiten la mentira.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador y un personaje bueno.' },
    { type: 'CAVEAT', text: 'Ese jugador estará loco diciendo que es ese personaje mañana, o podria ser ejecutado.' },
    { type: 'WIN', text: 'Usa la locura para torcer la historia publica del dia.' },
  ],
  chooseTargetTitle: 'Elige un Jugador',
  chooseTargetDescription: 'Selecciona al jugador que estará loco mañana.',
  chooseRoleTitle: 'Elige un Personaje',
  chooseRoleDescription: 'Selecciona el personaje del que debe estar loco.',
  confirmChoiceLabel: 'Aplicar locura',
} as const

export default es
