const es = {
  name: 'Enterrador',
  description: 'Cada noche*, descubres qué personaje murió por ejecución hoy.',

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
