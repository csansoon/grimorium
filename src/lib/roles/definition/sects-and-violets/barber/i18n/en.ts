const en = {
  name: 'Barber',
  description: 'If you died today or tonight, the Demon may swap 2 players\' characters.',
  quote: 'A sharp hand can leave everyone looking different.',
  lines: [
    { type: 'CAVEAT', text: 'The Demon chooses whether to use your death.' },
    { type: 'ADVICE', text: 'Your death can radically rewrite the game state.' },
    { type: 'BLUFF', text: 'Track who might benefit from a sudden character swap.' },
  ],
} as const

export default en
