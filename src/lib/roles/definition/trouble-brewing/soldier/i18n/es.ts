const es = {
  name: 'Soldado',
  description: 'Estás a salvo del Demonio.',
  quote: 'El escudo aguanta. Siempre aguanta.',
  lines: [
    { type: 'PASSIVE', text: 'El Demonio no puede matarte.' },
    { type: 'CAVEAT', text: 'Aún puedes morir por ejecución u otras habilidades.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // RoleReveal UI
  soldierInfo: 'Tu Protección',
  permanentlyProtected: 'Estás permanentemente protegido del Demonio.',
} as const

export default es
