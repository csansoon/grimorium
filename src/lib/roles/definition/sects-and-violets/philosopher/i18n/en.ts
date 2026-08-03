const en = {
  name: 'Philosopher',
  description: 'Once per game, at night, choose a good character: gain that ability. If this character is in play, it becomes drunk.',
  quote: 'Every question you answer creates a better one behind it.',
  lines: [
    { type: 'ONCE', text: 'Once per game, at night, choose a good character.' },
    { type: 'GAIN', text: 'You gain that ability for the rest of the game.' },
    { type: 'CAVEAT', text: 'If that character is already in play, they become drunk.' },
  ],
  chooseAbilityTitle: 'Choose a Good Ability',
  chooseAbilityDescription: 'Select the good character whose ability you want to gain.',
  confirmChoiceLabel: 'Gain Ability',
  waitLabel: 'Not Tonight',
} as const

export default en
