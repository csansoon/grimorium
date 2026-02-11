const es = {
  name: 'Imp',
  description:
    'Cada noche*, elige un jugador: muere. Si te matas a ti mismo, un Secuaz se convierte en el Imp.',

  // BounceRedirectUI
  bounceTitle: '¡Asesinato Redirigido!',
  bounceDescription:
    'El Demonio eligió a {target}, pero su asesinato rebotó. Elige quién muere en su lugar.',
  bounceOriginalLabel: 'objetivo original',

  // Self-kill conversion
  selectNewImpTitle: 'Seleccionar Nuevo Imp',
  selectNewImpDescription:
    'El Imp se mató a sí mismo. Elige qué Secuaz vivo se convierte en el nuevo Imp.',
  selectMinionToBecome: 'Selecciona un Secuaz para convertirse en el Imp',
  confirmNewImp: 'Confirmar Nuevo Imp',

  // First night: minions
  demonMinionsTitle: 'Tus Secuaces',
  demonMinionsDescription: 'Estos jugadores están en tu equipo malvado.',
  theseAreYourMinions: 'Estos son tus Secuaces:',

  // First night: bluffs
  selectBluffsTitle: 'Seleccionar Faroles',
  selectBluffsDescription:
    'Elige 3 roles buenos que no están en juego para que el Demonio finja ser.',
  selectThreeBluffs: 'Selecciona 3 roles como faroles',
  bluffsSelected: '{count} de 3 seleccionados',
  demonBluffsTitle: 'Tus Faroles',
  demonBluffsDescription:
    'Estos roles buenos NO están en juego. Puedes fingir ser uno de ellos.',
  theseAreYourBluffs: 'Estos roles no están en juego:',

  // History
  history: {
    choseToKill: '{player} eligió matar a {target}',
    failedToKill: '{player} intentó matar a {target}, pero estaba protegido/a',
    bounceRedirected:
      '{player} eligió a {target}, pero el asesinato fue redirigido a {redirect}',
    shownMinionsAndBluffs:
      '{player} vio a sus Secuaces y recibió faroles: {bluffs}',
    selfKilled: '{player} (Imp) eligió matarse a sí mismo/a',
    minionBecameImp: '{player} se convirtió en el nuevo Imp',
  },
} as const

export default es
