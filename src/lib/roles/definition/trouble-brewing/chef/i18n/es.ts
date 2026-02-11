const es = {
  name: 'Chef',
  description: 'Empiezas sabiendo cuántas parejas de jugadores malvados hay.',

  // NightAction UI
  info: 'Tu Información',
  evilPairsCount: 'Parejas malvadas sentadas juntas:',
  evilPairsExplanation:
    'Este es el número de parejas de jugadores malvados que están sentados uno al lado del otro.',

  // History
  history: {
    sawEvilPairs:
      '{player} descubrió que hay {count} parejas de jugadores malvados sentados juntos',
  },
} as const

export default es
