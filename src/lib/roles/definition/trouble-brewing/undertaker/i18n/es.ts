const es = {
  name: 'Enterrador',
  description: 'Cada noche*, descubres qué personaje murió por ejecución hoy.',
  quote: 'Los muertos siempre dicen la verdad. Solo hay que saber dónde mirar.',
  lines: [
    { type: 'NIGHT', text: 'Si un jugador es ejecutado durante el día, descubrirás su rol en la noche siguiente.' },
    { type: 'INFO', text: 'Si nadie fue ejecutado, no descubres nada.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // NightAction UI
  undertakerInfo: 'El Rol del Ejecutado',
  executedPlayerRole: 'El jugador ejecutado hoy era...',
  noExecutionToday: 'Nadie fue ejecutado hoy.',

  // History
  history: {
    sawExecutedRole:
      '{player} descubrió que el jugador ejecutado era el/la {role}',
    noExecution: '{player} descubrió que no hubo ejecución hoy',
  },
} as const

export default es
