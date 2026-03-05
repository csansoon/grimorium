const en = {
  name: 'Flowergirl',
  description: 'Each night, you learn if the Demon voted today.',
  quote: 'Every raised hand bends the petals in a different direction.',
  lines: [
    { type: 'NIGHT', text: 'Each night after the first, you learn whether the Demon voted during the day.' },
    { type: 'INFO', text: 'This is a yes-or-no answer.' },
    { type: 'WIN', text: 'Track suspicious voting patterns over multiple days.' },
  ],
  infoTitle: 'Flowergirl',
  question: 'Did the Demon vote today?',
  yesLabel: 'Yes',
  noLabel: 'No',
  configureTitle: 'Configure Flowergirl',
  configureDescription: 'Review and adjust the answer before showing the result.',
} as const

export default en
