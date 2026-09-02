const en = {
  name: 'Witch',
  description: 'Each night, choose a player: if they nominate tomorrow, they die.',
  quote: 'A promise from a witch is just a curse with better manners.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose a player.' },
    { type: 'CAVEAT', text: 'If they nominate during the next day, they die.' },
    { type: 'WIN', text: 'Use the curse to control who dares to open nominations.' },
  ],
  chooseTargetTitle: 'Choose a Cursed Player',
  chooseTargetDescription: 'If this player nominates tomorrow, they die.',
  confirmChoiceLabel: 'Apply Curse',
} as const

export default en
