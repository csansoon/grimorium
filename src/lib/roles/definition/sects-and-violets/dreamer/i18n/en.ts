const en = {
  name: 'Dreamer',
  description: 'Each night, choose a player: you learn 1 good and 1 evil character, 1 of which is correct.',
  quote: 'Dreams tell the truth twice, once in light and once in shadow.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose a player.' },
    { type: 'INFO', text: 'You learn one good role and one evil role; one of them is correct for that player.' },
    { type: 'WIN', text: 'Compare dreams across multiple nights to corner contradictions.' },
  ],
  chooseTargetTitle: 'Choose a Player',
  chooseTargetDescription: 'Select the player you want to dream about tonight.',
  continueLabel: 'Continue',
  chooseAlternateTitle: 'Choose the Alternate Role',
  chooseAlternateDescription: 'Pick the opposite-alignment role to show alongside {player}\'s true role.',
  chooseGoodTitle: 'Choose the Good Role',
  chooseGoodDescription: 'Pick the good role to show in this malfunctioning dream.',
  chooseEvilTitle: 'Choose the Evil Role',
  chooseEvilDescription: 'Pick the evil role to show in this malfunctioning dream.',
  showDreamLabel: 'Show Dream',
  infoTitle: 'Dreamer',
  revealDescription: 'One of these roles matches {player}.',
} as const

export default en
