const en = {
  name: 'Oracle',
  description: 'Each night, you learn how many dead players are evil.',
  quote: 'The dead still speak. You simply know how to count their warnings.',
  lines: [
    { type: 'NIGHT', text: 'Each night after the first, you learn how many dead players are evil.' },
    { type: 'INFO', text: 'This count updates as deaths accumulate.' },
    { type: 'WIN', text: 'Use the dead to measure how much evil has already been exposed.' },
  ],
  infoTitle: 'Oracle',
  countLabel: 'Dead evil players',
  configureTitle: 'Configure Oracle',
  configureDescription: 'Review and adjust the number before showing the result.',
  configureConfirm: 'Show Result',
} as const

export default en
