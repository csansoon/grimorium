const es = {
  name: 'Monje',
  description:
    'Cada noche*, elige un jugador (no tú mismo): está a salvo del Demonio esta noche.',

  // NightAction UI
  info: 'Elige un Jugador',
  selectPlayerToProtect:
    'Despierta a {player} y pídele que señale a un jugador para proteger del Demonio.',
  protectedForTheNight: 'está protegido/a por esta noche.',

  // History
  history: {
    protectedPlayer: '{player} protegió a {target} por esta noche',
  },
} as const

export default es
