const es = {
  name: 'Diablo',
  description:
    'Cada noche*, elige un jugador: muere. Si te matas a ti mismo, un Secuaz se convierte en el Diablo.',

  // DeflectRedirectUI
  deflectTitle: '¡Asesinato Redirigido!',
  deflectDescription:
    'El Demonio eligió a {target}, pero su asesinato fue deflectado. Elige quién muere en su lugar.',
  deflectOriginalLabel: 'objetivo original',

  // Role change reveal
  roleChangedDescription:
    'Ahora eres el Diablo. Cada noche, elegirás un jugador para matar.',

  // Self-kill conversion
  selectNewImpTitle: 'Seleccionar Nuevo Diablo',
  selectNewImpDescription:
    'El Diablo se mató a sí mismo. Como Cuentacuentos, elige qué Secuaz vivo se convertirá en el nuevo Diablo.',
  selectMinionToBecome: 'Selecciona un Secuaz para convertirse en el Diablo',
  confirmNewImp: 'Confirmar Nuevo Diablo',

  // First night: minions
  demonMinionsTitle: 'Tus Secuaces',
  demonMinionsDescription: 'Estos jugadores están en tu equipo malvado.',
  theseAreYourMinions: 'Estos son tus Secuaces:',

  // First night: bluffs
  selectBluffsTitle: 'Seleccionar Faroles',
  selectBluffsDescription:
    'Elige 3 roles buenos que no están en juego. Estos se mostrarán al Demonio como faroles seguros.',
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
    shownMinionsAndBluffs: '{player} vio a sus Secuaces y recibió faroles: ',
    selfKilled: '{player} (Diablo) eligió matarse a sí mismo/a',
    minionBecameImp: '{player} se convirtió en el nuevo Diablo',
  },
} as const

export default es
