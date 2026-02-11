const en = {
  name: 'Poisoner',
  description: 'Each night, choose a player: they are poisoned tonight.',

  // NightAction UI
  info: 'Choose a Target',
  selectPlayerToPoison:
    'Select a player to poison tonight. Their ability will malfunction.',

  // History
  history: {
    poisonedPlayer: '{player} poisoned {target}',
  },
} as const

export default en
