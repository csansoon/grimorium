const es = {
  name: 'Investigador',
  description:
    'Empiezas sabiendo que 1 de 2 jugadores es un Secuaz en particular.',
  quote: 'Sigue el dinero. Sigue los susurros. Sigue el miedo.',
  lines: [
    { type: 'NIGHT', text: 'En la primera noche, descubres 2 jugadores y 1 rol de Secuaz — uno de esos jugadores tiene ese rol.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // NightAction UI
  investigatorInfo: 'Tu Información',
  mustIncludeMinion:
    'Al menos uno de los jugadores seleccionados debe ser un Secuaz',
  oneOfTheseIsTheMinion:
    'Uno de estos jugadores es un Secuaz. ¡Recuerda quiénes son!',
  noMinionsInGame: 'Sin Secuaces',
  noMinionsMessage:
    'No hay Secuaces en esta partida. ¡Esta es información valiosa!',
  confirmNoMinions: 'Mostrar al Jugador',
  showNoMinions: 'Mostrar "Sin Secuaces"',

  // History
  history: {
    discoveredMinion:
      '{player} descubrió que {player1} o {player2} es el/la {role}',
    noMinions: '{player} descubrió que no hay Secuaces en esta partida',
  },
} as const

export default es
