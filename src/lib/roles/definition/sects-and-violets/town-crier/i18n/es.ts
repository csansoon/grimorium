const es = {
  name: 'Pregonero',
  description: 'Cada noche, aprendes si un Secuaz nomino hoy.',
  quote: 'Algunas campanas avisan al pueblo. Otras delatan quien tiro de la cuerda.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche despues de la primera, aprendes si un Secuaz hizo una nominacion durante el dia.' },
    { type: 'INFO', text: 'La respuesta es si o no.' },
    { type: 'WIN', text: 'Sigue quien inicia las presiones peligrosas hacia el bloque.' },
  ],
  infoTitle: 'Pregonero',
  question: 'Un Secuaz nomino hoy?',
  yesLabel: 'Si',
  noLabel: 'No',
  configureTitle: 'Configurar Pregonero',
  configureDescription: 'Revisa y ajusta la respuesta antes de mostrar el resultado.',
} as const

export default es
