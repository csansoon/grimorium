const en = {
  name: 'Town Crier',
  description: 'Each night, you learn if a Minion nominated today.',
  quote: 'Some bells warn the town. Others only reveal who pulled the rope.',
  lines: [
    { type: 'NIGHT', text: 'Each night after the first, you learn whether a Minion made a nomination during the day.' },
    { type: 'INFO', text: 'This is a yes-or-no answer.' },
    { type: 'WIN', text: 'Track who starts dangerous pushes on the block.' },
  ],
  infoTitle: 'Town Crier',
  question: 'Did a Minion nominate today?',
  yesLabel: 'Yes',
  noLabel: 'No',
  configureTitle: 'Configure Town Crier',
  configureDescription: 'Choose the answer to show if the Town Crier is malfunctioning.',
} as const

export default en
