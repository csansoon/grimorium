const en = {
  name: 'Empath',
  description:
    'Each night, you learn how many of your 2 alive neighbours are evil.',

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
