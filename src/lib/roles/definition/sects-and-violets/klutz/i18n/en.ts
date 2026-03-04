const en = {
  name: 'Klutz',
  description: 'When you learn that you died by execution, publicly choose 1 alive player. If they are evil, your team loses.',
  quote: 'One wrong move can doom everyone.',
  lines: [
    { type: 'CAVEAT', text: 'You only matter when executed.' },
    { type: 'ADVICE', text: 'Leave clues about who you trust before you die.' },
    { type: 'WIN', text: 'Choose carefully if the town turns on you.' },
  ],
} as const

export default en
