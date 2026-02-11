const en = {
  name: 'Slayer',
  description:
    'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',

  // History
  history: {
    killedDemon: '{slayer} shot {target} — they were the Demon!',
    missed: '{slayer} shot {target} — nothing happened',
  },
} as const

export default en
