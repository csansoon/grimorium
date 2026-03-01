const es = {
  name: 'Virgen',
  description:
    'La primera vez que eres nominado, si el nominador es un Aldeano, es ejecutado inmediatamente.',
  quote: 'La inocencia es la hoja más afilada. Pero solo corta una vez.',
  lines: [
    { type: 'PASSIVE', text: 'La primera vez que te nominan, si el nominador es un Aldeano, es ejecutado inmediatamente.' },
    { type: 'INFO', text: 'Si el nominador no es un Aldeano, nada sucede y la nominación continúa.' },
    { type: 'CAVEAT', text: 'Esta habilidad se gasta tras la primera nominación, sin importar el resultado.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],

  // History
  history: {
    townsfolkExecuted: '¡{nominator} nominó a la Virgen y fue ejecutado!',
    lostPurity:
      '{nominator} nominó a la Virgen — el poder de la Virgen se ha agotado',
  },
} as const

export default es
