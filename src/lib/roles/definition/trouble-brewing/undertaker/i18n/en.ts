const en = {
  name: 'Undertaker',
  description:
    'Each night*, you learn which character died by execution today.',
  quote: 'The dead always tell the truth. You just have to know where to look.',
  lines: [
    { type: 'NIGHT', text: 'If a player is executed during the day, you will learn their role on the next night.' },
    { type: 'INFO', text: 'If no one was executed, you learn nothing.' },
    { type: 'WIN', text: 'Execute the Demon to win.' },
  ],

  // NightAction UI
  undertakerInfo: 'The Executed Role',
  executedPlayerRole: 'The player executed today was...',
  noExecutionToday: 'Nobody was executed today.',

  // History
  history: {
    sawExecutedRole: '{player} learned that the executed player was the {role}',
    noExecution: '{player} learned there was no execution today',
  },
} as const

export default en
