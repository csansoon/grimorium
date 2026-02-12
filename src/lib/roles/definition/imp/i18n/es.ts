const es = {
  name: 'Diablillo',
  description:
    'Cada noche*, elige un jugador: muere. Si te matas a ti mismo, un Secuaz se convierte en el Diablillo.',

  // DeflectRedirectUI
  deflectTitle: '¡Asesinato Redirigido!',
  deflectDescription:
    'El Demonio eligió a {target}, pero su asesinato fue deflectado. Elige quién muere en su lugar.',
  deflectOriginalLabel: 'objetivo original',

  // Self-kill conversion
  selectNewImpTitle: 'Seleccionar Nuevo Diablillo',
  selectNewImpDescription:
    'El Diablillo se mató a sí mismo. Elige qué Secuaz vivo se convierte en el nuevo Diablillo.',
  selectMinionToBecome: 'Selecciona un Secuaz para convertirse en el Diablillo',
  confirmNewImp: 'Confirmar Nuevo Diablillo',

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
    deflectRedirected:
      '{player} eligió a {target}, pero el asesinato fue deflectado a {redirect}',
    shownMinionsAndBluffs:
      '{player} vio a sus Secuaces y recibió faroles: ',
    selfKilled: '{player} (Diablillo) eligió matarse a sí mismo/a',
    minionBecameImp: '{player} se convirtió en el nuevo Diablillo',
  },
} as const

export default es
