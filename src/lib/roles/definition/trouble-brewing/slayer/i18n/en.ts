const en = {
  name: 'Slayer',
  description:
    'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
  quote: 'One shot. Make it count.',
  lines: [
    { type: 'DAY', text: 'During the day, you can publicly shoot one player.' },
    { type: 'INFO', text: 'If they are the Demon, they instantly die. Otherwise, nothing happens.' },
    { type: 'CAVEAT', text: 'You only have one shot.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // History
  history: {
    killedDemon: '{slayer} shot {target} — they were the Demon!',
    missed: '{slayer} shot {target} — nothing happened',
  },
} as const

export default en
