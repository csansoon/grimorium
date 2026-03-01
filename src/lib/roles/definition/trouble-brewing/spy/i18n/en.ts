const en = {
  name: 'Spy',
  description:
    'Each night, you may look at the Grimoire. You might register as good & as a Townsfolk or Outsider, even if you are dead.',
  quote: 'I know what they know. They just don\'t know I know.',
  lines: [
    { type: 'NIGHT', text: 'Each night, you may look at the Storyteller\'s Grimoire.' },
    { type: 'ADVICE', text: 'The Grimoire contains the real roles and status of all players.' },
    { type: 'PASSIVE', text: 'You may register as good, as a Townsfolk, or as an Outsider to other players.' },
    { type: 'WIN', text: 'Keep your Demon alive to win.' },
  ],

  // NightAction UI
  spyGrimoireTitle: 'The Grimoire',
  spyGrimoireDescription: 'You may see all players and their roles.',
  spyMalfunctionTitle: 'The Grimoire',
  spyMalfunctionDescription:
    'The Spy is poisoned or drunk, so they should not see the true Grimoire! To maintain the illusion, do not hand them the device. Show them a physical Grimoire with false information instead.',

  // First night: evil team
  evilTeamTitle: 'Your Evil Team',
  evilTeamDescription: 'These are your fellow evil players.',

  // History
  history: {
    viewedGrimoire: '{player} looked at the Grimoire',
  },
} as const

export default en
