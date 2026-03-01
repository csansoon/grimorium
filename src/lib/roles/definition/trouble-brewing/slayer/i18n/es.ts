const es = {
  name: 'Verdugo',
  description:
    'Una vez por partida, durante el día, elige públicamente a un jugador: si es el Demonio, muere.',
  quote: 'Un disparo. Que cuente.',
  lines: [
    { type: 'DAY', text: 'Durante el día, puedes disparar públicamente a un jugador.' },
    { type: 'INFO', text: 'Si es el Demonio, muere instantáneamente. Si no, no pasa nada.' },
    { type: 'CAVEAT', text: 'Sólo tienes un disparo.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // History
  history: {
    killedDemon: '¡{slayer} disparó a {target} — era el Demonio!',
    missed: '{slayer} disparó a {target} — no pasó nada',
  },
} as const

export default es
