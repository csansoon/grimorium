const en = {
  name: 'Imp',
  description:
    'Each night*, choose a player: they die. If you kill yourself, a Minion becomes the Imp.',

  // BounceRedirectUI
  bounceTitle: 'Kill Redirected!',
  bounceDescription:
    'The Demon targeted {target}, but their kill bounced. Choose who dies instead.',
  bounceOriginalLabel: 'original target',

  // Self-kill conversion
  selectNewImpTitle: 'Select New Imp',
  selectNewImpDescription:
    'The Imp killed themselves. Choose which alive Minion becomes the new Imp.',
  selectMinionToBecome: 'Select a Minion to become the Imp',
  confirmNewImp: 'Confirm New Imp',

  // First night: minions
  demonMinionsTitle: 'Your Minions',
  demonMinionsDescription: 'These players are on your evil team.',
  theseAreYourMinions: 'These are your Minions:',

  // First night: bluffs
  selectBluffsTitle: 'Select Bluffs',
  selectBluffsDescription:
    'Choose 3 good roles not in play for the Demon to bluff as.',
  selectThreeBluffs: 'Select 3 roles as bluffs',
  bluffsSelected: '{count} of 3 selected',
  demonBluffsTitle: 'Your Bluffs',
  demonBluffsDescription:
    'These good roles are NOT in play. You may bluff as one of them.',
  theseAreYourBluffs: 'These roles are not in play:',

  // History
  history: {
    choseToKill: '{player} chose to kill {target}',
    failedToKill: '{player} tried to kill {target}, but they were protected',
    bounceRedirected:
      '{player} targeted {target}, but the kill was redirected to {redirect}',
    shownMinionsAndBluffs:
      '{player} was shown their Minions and given bluffs: {bluffs}',
    selfKilled: '{player} (Imp) chose to kill themselves',
    minionBecameImp: '{player} became the new Imp',
  },
} as const

export default en
