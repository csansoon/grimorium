const es = {
  name: 'Chef',
  description: 'Empiezas sabiendo cuántas parejas de jugadores malvados hay.',
  quote: 'Demasiados cocineros arruinan el caldo. Pero un buen chef cuenta los cuchillos.',
  lines: [
    { type: 'NIGHT', text: 'En la primera noche, descubres cuántas parejas de jugadores malvados están sentados juntos.' },
    { type: 'INFO', text: 'Una "pareja" son dos jugadores malvados sentados uno al lado del otro.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

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
