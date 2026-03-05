const en = {
  name: 'Sweetheart',
  description: 'When you die, 1 player is drunk from now on.',
  quote: 'Love leaves a mark, even after it is gone.',
  lines: [
    { type: 'CAVEAT', text: 'When you die, the Storyteller makes 1 player drunk.' },
    { type: 'ADVICE', text: 'Your death can hide critical information later.' },
    { type: 'BLUFF', text: 'Claim a role that can explain bad information.' },
  ],
} as const

export default en
