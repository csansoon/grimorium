const en = {
  name: 'Chef',
  description: 'You start knowing how many pairs of evil players there are.',
  quote: 'Too many cooks spoil the broth. But a wise chef counts the knives.',
  lines: [
    { type: 'NIGHT', text: 'In the first night, you learn how many pairs of evil players are sitting next to each other.' },
    { type: 'INFO', text: 'A "pair" means two evil players who are sitting next to each other.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // NightAction UI
  info: "Chef's Information",
  evilPairsCount: 'Evil pairs sitting together:',
  evilPairsExplanation:
    'This is the number of pairs of evil players that are sitting next to each other.',

  // History
  history: {
    sawEvilPairs:
      '{player} learned there are {count} pairs of evil players sitting together',
  },
} as const

export default en
