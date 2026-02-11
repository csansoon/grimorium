const en = {
  name: 'Monk',
  description:
    'Each night*, choose a player (not yourself): they are safe from the Demon tonight.',

  // NightAction UI
  info: 'Choose a Player',
  selectPlayerToProtect: 'Select a player to protect from the Demon tonight.',
  protectedForTheNight: 'is protected for the night.',

  // History
  history: {
    protectedPlayer: '{player} protected {target} for the night',
  },
} as const

export default en
