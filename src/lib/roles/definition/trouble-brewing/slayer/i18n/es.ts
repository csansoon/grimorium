const es = {
  name: 'Matador',
  description:
    'Una vez por partida, durante el día, elige públicamente a un jugador: si es el Demonio, muere.',

  // History
  history: {
    killedDemon: '¡{slayer} disparó a {target} — era el Demonio!',
    missed: '{slayer} disparó a {target} — no pasó nada',
  },
} as const

export default es
