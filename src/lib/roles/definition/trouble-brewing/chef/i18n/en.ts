const en = {
  name: 'Chef',
  description: 'You start knowing how many pairs of evil players there are.',

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
