const es = {
  name: 'Recluso',
  description:
    'Podrías registrarte como malvado y como un Secuaz o Demonio, incluso estando muerto.',
  quote: 'Me evitan. Quizás tienen razón.',
  lines: [
    { type: 'PASSIVE', text: 'Puedes aparecer como malvado, como Secuaz o como Demonio ante otros.' },
    { type: 'CAVEAT', text: 'Otros roles con la habilidad de ver tu rol podrían ver un rol falso en su lugar.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],
} as const

export default es
