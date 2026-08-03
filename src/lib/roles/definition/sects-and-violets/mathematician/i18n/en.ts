const en = {
  name: 'Mathematician',
  description:
    "Each night, you learn how many players' abilities worked abnormally due to another character's ability.",
  quote: 'Numbers do not lie, but the reasons behind them often do.',
  lines: [
    { type: 'NIGHT', text: 'Each night, you learn how many abilities malfunctioned because of another character.' },
    { type: 'INFO', text: 'This is a single number chosen by the Storyteller.' },
    { type: 'WIN', text: 'Use changes in the count to locate poisoning, drunkenness, and strange interactions.' },
  ],
  infoTitle: 'Mathematician',
  countLabel: 'Abilities that worked abnormally',
  configureTitle: 'Configure Mathematician',
  configureDescription: 'Choose the number of abilities that malfunctioned tonight.',
  configureConfirm: 'Show Result',
} as const

export default en
