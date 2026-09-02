const en = {
  name: 'Evil Twin',
  description: 'You and an opposing player know each other. If the good twin is executed, evil wins. If you are executed, good wins.',
  quote: 'Two faces, one truth, and both will swear the other stole it.',
  lines: [
    { type: 'SETUP', text: 'You and a good player are linked as twins.' },
    { type: 'WIN', text: 'If the good twin is executed, evil wins. If the evil twin is executed, good wins.' },
    { type: 'INFO', text: 'Both twins know who the other one is.' },
  ],
  setupTitle: 'Choose the Good Twin',
  setupDescription: 'Select the good player linked to the Evil Twin.',
  setupConfirm: 'Link Twins',
} as const

export default en
