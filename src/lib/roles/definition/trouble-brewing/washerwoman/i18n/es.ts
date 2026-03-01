const es = {
  name: 'Lavandera',
  description:
    'Empiezas sabiendo que 1 de 2 jugadores es un Aldeano en particular.',
  quote: 'Hasta las sábanas más sucias guardan rastros de quien las vistió.',
  lines: [
    { type: 'NIGHT', text: 'En la primera noche, descubres 2 jugadores y 1 rol de Aldeano — uno de esos jugadores tiene ese rol.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // NightAction UI
  washerwomanInfo: 'Tu Información',
  mustIncludeTownsfolk:
    'Al menos uno de los jugadores seleccionados debe ser un Aldeano',
  oneOfTheseIsTheTownsfolk:
    'Uno de estos jugadores es un Aldeano. ¡Recuerda quiénes son!',
  noTownsfolkInGame: 'Sin Aldeanos',
  noTownsfolkMessage:
    'No hay otros Aldeanos en esta partida. ¡Esta es información valiosa!',
  confirmNoTownsfolk: 'Mostrar al Jugador',
  showNoTownsfolk: 'Mostrar "Sin Aldeanos"',

  // History
  history: {
    discoveredTownsfolk:
      '{player} descubrió que {player1} o {player2} es el/la {role}',
    noTownsfolk: '{player} descubrió que no hay otros Aldeanos en esta partida',
  },
} as const

export default es
