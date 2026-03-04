const en = {
  name: 'Snake Charmer',
  description: 'Each night, choose an alive player: a chosen Demon swaps characters & alignments with you, and is then poisoned.',
  quote: 'The trick is not in charming the serpent. It is in surviving the bite.',
  lines: [
    { type: 'NIGHT', text: 'Each night, choose an alive player.' },
    { type: 'SWAP', text: 'If you choose the Demon, you swap roles and alignments, and they become poisoned.' },
    { type: 'WIN', text: 'A lucky catch can end the game by turning you evil in the dark.' },
  ],
  chooseTargetTitle: 'Choose an Alive Player',
  chooseTargetDescription: 'Pick the player you want to charm tonight.',
  confirmChoiceLabel: 'Lock Choice',
} as const

export default en
