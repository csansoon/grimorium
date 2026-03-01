const en = {
  name: 'Recluse',
  description:
    'You might register as evil & as a Minion or Demon, even if dead.',
  quote: 'They avoid me. Perhaps they are right to.',
  lines: [
    { type: 'PASSIVE', text: 'You may register as evil, as a Minion, or as a Demon to other players.' },
    { type: 'CAVEAT', text: 'Other roles with the ability to see your role might see a false role instead.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],
} as const

export default en
