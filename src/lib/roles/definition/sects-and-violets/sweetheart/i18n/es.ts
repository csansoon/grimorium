const es = {
  name: 'Corazon Dulce',
  description: 'Cuando mueres, 1 jugador queda borracho a partir de ahora.',
  quote: 'El amor deja marca, incluso cuando ya no está.',
  lines: [
    { type: 'CAVEAT', text: 'Cuando mueres, el Narrador vuelve borracho a 1 jugador.' },
    { type: 'ADVICE', text: 'Tu muerte puede torcer información importante más tarde.' },
    { type: 'BLUFF', text: 'Finge un rol que pueda justificar información incorrecta.' },
  ],
} as const

export default es
