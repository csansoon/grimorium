const en = {
  name: 'Sage',
  description: 'If the Demon kills you, you learn that it is 1 of 2 players.',
  quote: 'Wisdom often arrives too late to save the wise.',
  lines: [
    { type: 'CAVEAT', text: 'You only trigger if the Demon kills you.' },
    { type: 'ADVICE', text: 'If you die at night, compare your pair with public claims.' },
    { type: 'WIN', text: 'Use your death to narrow the Demon pool quickly.' },
  ],
} as const

export default en
