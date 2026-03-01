const en = {
  name: 'Empath',
  description:
    'Each night, you learn how many of your 2 alive neighbours are evil.',
  quote: 'I feel the weight of their sins, even when they smile.',
  lines: [
    { type: 'NIGHT', text: 'Each night, you learn how many of your alive neighbors are evil.' },
    { type: 'INFO', text: 'Only your two nearest alive neighbors count, skipping dead players.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // NightAction UI
  info: "Empath's Information",
  evilNeighborsCount: 'Evil neighbors among your alive neighbors:',
  evilNeighborsExplanation:
    'This is the number of evil players sitting immediately next to you among alive players.',

  // History
  history: {
    sawEvilNeighbors:
      '{player} learned that {count} of their neighbors are evil',
  },
} as const

export default en
