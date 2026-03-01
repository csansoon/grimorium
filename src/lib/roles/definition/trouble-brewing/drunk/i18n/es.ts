const es = {
  name: 'Borracho',
  description:
    'No sabes que eres el Borracho. Crees que eres un personaje Aldeano, pero no lo eres.',
  quote: 'Las noches más cálidas son las que no puedes recordar del todo.',
  lines: [
    { type: 'PASSIVE', text: 'Crees que eres un Aldeano. No lo eres.' },
    { type: 'CAVEAT', text: 'En lugar de esta carta, ves la carta de otro rol.' },
    { type: 'CAVEAT', text: 'La habilidad que crees tener no funciona. Tu información es siempre falsa.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // SetupAction UI
  drunkSetupTitle: 'Configuración del Borracho',
  drunkSetupDescription:
    'Elige qué rol de Aldeano cree ser el Borracho. Verán este rol durante la revelación y jugarán como si fueran ese rol.',
  chooseBelievedRole: 'Elige el rol de Aldeano que cree ser',
} as const

export default es
