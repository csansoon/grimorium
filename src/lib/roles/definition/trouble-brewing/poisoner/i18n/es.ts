const es = {
  name: 'Envenenador',
  description: 'Cada noche, elige un jugador: está envenenado esta noche.',

  // NightAction UI
  info: 'Elige un Objetivo',
  selectPlayerToPoison:
    'Selecciona un jugador para envenenar esta noche. Su habilidad fallará.',

  // History
  history: {
    poisonedPlayer: '{player} envenenó a {target}',
  },
} as const

export default es
