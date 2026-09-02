const es = {
  name: 'Sabio',
  description: 'Si el Demonio te mata, aprendes que es 1 de 2 jugadores.',
  quote: 'La sabiduría a veces llega demasiado tarde para salvar al sabio.',
  lines: [
    { type: 'CAVEAT', text: 'Solo se activa si el Demonio te mata.' },
    { type: 'ADVICE', text: 'Si mueres de noche, contrasta tu pareja con las declaraciones públicas.' },
    { type: 'WIN', text: 'Usa tu muerte para reducir rápido el grupo de posibles Demonios.' },
  ],
} as const

export default es
