const es = {
  name: 'Investigador',
  description:
    'Empiezas sabiendo que 1 de 2 jugadores es un Secuaz en particular.',

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
