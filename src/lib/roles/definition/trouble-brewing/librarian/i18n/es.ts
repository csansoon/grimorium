const es = {
  name: 'Bibliotecario',
  description:
    'Empiezas sabiendo que 1 de 2 jugadores es un Forastero en particular. (O que no hay ninguno en juego.)',

  // NightAction UI
  librarianInfo: 'Tu Información',
  mustIncludeOutsider:
    'Al menos uno de los jugadores seleccionados debe ser un Forastero',
  oneOfTheseIsTheOutsider:
    'Uno de estos jugadores es un Forastero. ¡Recuerda quiénes son!',
  noOutsidersInGame: 'Sin Forasteros',
  noOutsidersMessage:
    'No hay Forasteros en esta partida. ¡Esta es información valiosa!',
  confirmNoOutsiders: 'Mostrar al Jugador',
  showNoOutsiders: 'Mostrar "Sin Forasteros"',

  // History
  history: {
    discoveredOutsider:
      '{player} descubrió que {player1} o {player2} es el/la {role}',
    noOutsiders: '{player} descubrió que no hay Forasteros en esta partida',
  },
} as const

export default es
