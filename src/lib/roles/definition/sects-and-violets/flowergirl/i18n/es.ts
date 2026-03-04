const es = {
  name: 'Chica de las Flores',
  description: 'Cada noche, aprendes si el Demonio voto hoy.',
  quote: 'Cada mano alzada mueve los petalos en una direccion distinta.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche despues de la primera, aprendes si el Demonio voto durante el dia.' },
    { type: 'INFO', text: 'La respuesta es si o no.' },
    { type: 'WIN', text: 'Sigue los patrones de voto sospechosos con el paso de los dias.' },
  ],
  infoTitle: 'Chica de las Flores',
  question: 'El Demonio voto hoy?',
  yesLabel: 'Si',
  noLabel: 'No',
  configureTitle: 'Configurar Chica de las Flores',
  configureDescription: 'Elige la respuesta que se mostrara si esta afectada.',
} as const

export default es
