const en = {
  name: 'Artist',
  description: 'Once per game, during the day, privately ask the Storyteller any yes/no question.',
  quote: 'A single honest line can split the whole canvas open.',
  lines: [
    { type: 'ONCE', text: 'Once per game, during the day, ask a yes/no question.' },
    { type: 'INFO', text: 'The Storyteller answers truthfully.' },
    { type: 'WIN', text: 'Save it for the question that changes the whole table.' },
  ],
} as const

export default en
