const es = {
  name: 'Bruja del Foso',
  description: 'Cada noche, elige un jugador y un personaje: si el Narrador lo permite, se convierte en ese personaje.',
  quote: 'Con suficiente tierra y valor, cualquiera puede ser rehecho.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador y un personaje.' },
    { type: 'CHANGE', text: 'Ese jugador se convierte en el personaje elegido.' },
    { type: 'WIN', text: 'Usa el cambio para remodelar la mesa y esconder el rastro del mal.' },
  ],
  chooseTargetTitle: 'Elige un Jugador',
  chooseTargetDescription: 'Selecciona al jugador que quieres transformar esta noche.',
  chooseRoleTitle: 'Elige un Nuevo Personaje',
  chooseRoleDescription: 'Selecciona el personaje en el que se convertirá.',
  confirmChoiceLabel: 'Transformar jugador',
} as const

export default es
