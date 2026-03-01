const en = {
  name: 'Soldier',
  description: 'You are safe from the Demon.',
  quote: 'The shield holds. It always holds.',
  lines: [
    { type: 'PASSIVE', text: 'You cannot be killed by the Demon.' },
    { type: 'CAVEAT', text: 'You can still die by execution or other abilities.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // RoleReveal UI
  soldierInfo: 'Your Protection',
  permanentlyProtected: 'You are permanently protected from the Demon.',
} as const

export default en
