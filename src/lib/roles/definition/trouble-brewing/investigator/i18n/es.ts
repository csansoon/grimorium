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

  // History
  history: {
    discoveredMinion:
      '{player} descubrió que {player1} o {player2} es el/la {role}',
  },
} as const

export default es
