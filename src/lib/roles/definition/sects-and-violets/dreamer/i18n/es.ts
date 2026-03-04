const es = {
  name: 'Soñador',
  description: 'Cada noche, elige un jugador: aprendes 1 personaje bueno y 1 malvado, 1 de los cuales es correcto.',
  quote: 'Los sueños dicen la verdad dos veces: una en luz y otra en sombra.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, elige un jugador.' },
    { type: 'INFO', text: 'Aprendes un rol bueno y uno malvado; uno de ellos es correcto para ese jugador.' },
    { type: 'WIN', text: 'Compara sueños a lo largo de varias noches para encerrar contradicciones.' },
  ],
  chooseTargetTitle: 'Elige un Jugador',
  chooseTargetDescription: 'Selecciona al jugador sobre el que quieres soñar esta noche.',
  continueLabel: 'Continuar',
  chooseAlternateTitle: 'Elige el Rol Alternativo',
  chooseAlternateDescription: 'Elige el rol de alineacion opuesta para mostrar junto al rol verdadero de {player}.',
  chooseGoodTitle: 'Elige el Rol Bueno',
  chooseGoodDescription: 'Elige el rol bueno que se mostrara en este sueño afectado.',
  chooseEvilTitle: 'Elige el Rol Malvado',
  chooseEvilDescription: 'Elige el rol malvado que se mostrara en este sueño afectado.',
  showDreamLabel: 'Mostrar sueño',
  infoTitle: 'Soñador',
  revealDescription: 'Uno de estos roles coincide con {player}.',
} as const

export default es
