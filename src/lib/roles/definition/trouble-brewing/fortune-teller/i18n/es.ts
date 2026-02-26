const es = {
  name: 'Adivino',
  description:
    'Cada noche, elige 2 jugadores: descubres si alguno es un Demonio. Hay un jugador bueno que se registra como Demonio para ti.',

  // SetupAction UI
  redHerringSetupTitle: 'Configuración de Pista Falsa',

  // NightAction UI
  fortuneTellerInfo: 'Tu Visión',
  selectTwoPlayersToCheck:
    'Despierta a {player} y pídele que señale a 2 jugadores para comprobar si son Demonios.',
  selectRedHerring: 'Asignar Pista Falsa',
  redHerringInfo:
    'Selecciona un jugador bueno que se registrará como Demonio para este Adivino.',
  selectGoodPlayerAsRedHerring: 'Selecciona un jugador bueno como Pista Falsa',
  selectRandomRedHerring: 'Aleatorio',
  yesOneIsDemon: 'SÍ — ¡Uno de ellos es un Demonio!',
  noNeitherIsDemon: 'NO — Ninguno es un Demonio.',
  fortuneTellerDemonDetected: 'Un Demonio camina entre ellos',
  fortuneTellerNoDemon: 'Ningún Demonio camina entre ellos',

  // History
  history: {
    sawDemon:
      '{player} revisó a {player1} y {player2} — SÍ, uno es un Demonio (o Pista Falsa)',
    sawNoDemon:
      '{player} revisó a {player1} y {player2} — NO, ninguno es un Demonio',
    redHerringAssigned:
      '{redHerring} fue asignado como la Pista Falsa para {player}',
  },
} as const

export default es
