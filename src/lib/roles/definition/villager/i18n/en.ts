const en = {
  name: 'Villager',
  description:
    'You have no ability. But you are still a good person! Help your town find the Demon.',
  quote: 'The strength of the village is in its people. Every voice counts.',
  lines: [
    { type: 'PASSIVE', text: 'You have no special ability.' },
    { type: 'ADVICE', text: 'Listen, discuss, and use your vote wisely — your judgment is your weapon.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],
} as const

export default en
