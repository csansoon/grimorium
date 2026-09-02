const en = {
  name: 'Cerenovus',
  description: 'Each night, choose a player and a good character: they are mad they are this character tomorrow, or might be executed.',
  quote: 'Reality is optional if enough people repeat the lie.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose a player and a good character.' },
    { type: 'CAVEAT', text: 'That player is mad they are that character tomorrow, or might be executed.' },
    { type: 'WIN', text: 'Use madness to bend the public story of the day.' },
  ],
  chooseTargetTitle: 'Choose a Player',
  chooseTargetDescription: 'Select the player who will be mad tomorrow.',
  chooseRoleTitle: 'Choose a Character',
  chooseRoleDescription: 'Select the character they must be mad as.',
  confirmChoiceLabel: 'Apply Madness',
} as const

export default en
