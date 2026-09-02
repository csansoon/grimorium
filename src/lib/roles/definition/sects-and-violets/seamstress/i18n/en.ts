const en = {
  name: 'Seamstress',
  description: 'Once per game, at night, choose 2 players: you learn if they are the same alignment.',
  quote: 'The cleanest stitches are the ones that pull two truths together.',
  lines: [
    { type: 'ONCE', text: 'Once per game, at night, choose 2 players.' },
    { type: 'INFO', text: 'You learn whether they share the same alignment.' },
    { type: 'WIN', text: 'Save it for the moment when a single comparison matters most.' },
  ],
  chooseTitle: 'Choose Two Players',
  chooseDescription: 'Select the two players you want to compare tonight.',
  confirmChoiceLabel: 'Show Result',
  waitLabel: 'Not Tonight',
  infoTitle: 'Seamstress',
  question: 'Are {first} and {second} the same alignment?',
  sameLabel: 'Same',
  differentLabel: 'Different',
  configureTitle: 'Configure Seamstress',
  configureDescription: 'Choose the answer to show for {first} and {second} if the Seamstress is malfunctioning.',
} as const

export default en
