const en = {
  name: 'Drunk',
  description:
    'You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.',
  quote: 'The warmest nights are the ones you can\'t quite remember.',
  lines: [
    { type: 'PASSIVE', text: 'You believe you are a Townsfolk. You are not.' },
    { type: 'CAVEAT', text: 'Instead of this card, you see another role\'s card.' },
    { type: 'CAVEAT', text: 'Whatever ability you think you have doesn\'t work. Your information is always false.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // SetupAction UI
  drunkSetupTitle: 'Drunk Setup',
  drunkSetupDescription:
    'Choose which Townsfolk role the Drunk believes they are. They will see this role during role revelation and play as if they are that role.',
  chooseBelievedRole: 'Choose the believed Townsfolk role',
} as const

export default en
