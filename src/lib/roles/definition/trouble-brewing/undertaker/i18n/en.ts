const en = {
  name: 'Undertaker',
  description:
    'Each night*, you learn which character died by execution today.',

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
