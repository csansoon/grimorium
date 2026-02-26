const en = {
  name: 'Fortune Teller',
  description:
    'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',

  // SetupAction UI
  redHerringSetupTitle: 'Red Herring Setup',

  // NightAction UI
  fortuneTellerInfo: 'Your Vision',
  selectTwoPlayersToCheck: 'Wake {player} and ask them to point to 2 players to check for Demons.',
  selectRedHerring: 'Assign Red Herring',
  redHerringInfo:
    'Select a good player that will register as a Demon for this Fortune Teller.',
  selectGoodPlayerAsRedHerring: 'Select a good player as the Red Herring',
  selectRandomRedHerring: 'Random',
  yesOneIsDemon: 'YES — One of them is a Demon!',
  noNeitherIsDemon: 'NO — Neither is a Demon.',
  fortuneTellerDemonDetected: 'A Demon walks among them',
  fortuneTellerNoDemon: 'No Demon walks among them',

  // History
  history: {
    sawDemon:
      '{player} checked {player1} and {player2} — YES, one is a Demon (or Red Herring)',
    sawNoDemon:
      '{player} checked {player1} and {player2} — NO, neither is a Demon',
    redHerringAssigned:
      '{redHerring} was assigned as the Red Herring for {player}',
  },
} as const

export default en
