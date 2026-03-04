const en = {
  name: 'Pit-Hag',
  description: 'Each night, choose a player and a character: if the Storyteller agrees, they become that character.',
  quote: 'With enough dirt and nerve, anyone can be remade.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose a player and a character.' },
    { type: 'CHANGE', text: 'That player becomes the chosen character.' },
    { type: 'WIN', text: 'Use the change to reshape the board and hide evil tracks.' },
  ],
  chooseTargetTitle: 'Choose a Player',
  chooseTargetDescription: 'Select the player you want to transform tonight.',
  chooseRoleTitle: 'Choose a New Character',
  chooseRoleDescription: 'Select the character they will become.',
  confirmChoiceLabel: 'Transform Player',
} as const

export default en
