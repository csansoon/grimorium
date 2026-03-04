const en = {
  name: 'Clockmaker',
  description: 'You start knowing how many steps apart the Demon is from its nearest Minion.',
  quote: 'Every seat is a mark on the dial, every lie a shifting gear.',
  lines: [
    { type: 'FIRST', text: 'On the first night, you learn the shortest distance between the Demon and any Minion.' },
    { type: 'INFO', text: 'Distance is counted around the circle of seats.' },
    { type: 'WIN', text: 'Use the spacing to narrow the evil team quickly.' },
  ],
  infoTitle: 'Clockmaker',
  distanceLabel: 'Distance to the nearest Minion',
  configureTitle: 'Configure Clockmaker',
  configureDescription: 'Choose the distance to show if the Clockmaker is malfunctioning.',
  configureConfirm: 'Show Result',
} as const

export default en
