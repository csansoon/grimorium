const en = {
  name: 'Mayor',
  description:
    'If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.',
  quote: 'The town endures because someone must hold the line.',
  lines: [
    { type: 'PASSIVE', text: 'If only 3 players live and no execution occurs, good wins.' },
    { type: 'PROTECT', text: 'If you are targeted by the demon at night, another player might die instead.' },
    { type: 'WIN', text: 'Execute the Demon — or survive to peaceful victory.' },
  ],
} as const

export default en
