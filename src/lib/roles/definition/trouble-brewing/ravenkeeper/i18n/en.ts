const en = {
  name: 'Ravenkeeper',
  description:
    'If you die at night, you are woken to choose a player: you learn their character.',

  // NightAction UI
  ravenkeeperInfo: 'Choose a Player',
  selectPlayerToSeeRole: 'You have died! Select a player to learn their role.',
  playerRoleIs: 'Their role is...',

  // History
  history: {
    sawRole: "{player} chose to see {target}'s role: {role}",
  },
} as const

export default en
