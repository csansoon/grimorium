const es = {
  name: 'Torpe',
  description: 'Cuando aprendes que moriste por ejecución, elige públicamente a 1 jugador vivo. Si es malvado, tu equipo pierde.',
  quote: 'Un mal paso puede condenar a todos.',
  lines: [
    { type: 'CAVEAT', text: 'Solo importa cuando te ejecutan.' },
    { type: 'ADVICE', text: 'Deja pistas sobre en quién confías antes de morir.' },
    { type: 'WIN', text: 'Elige con cuidado si el pueblo se vuelve contra ti.' },
  ],
} as const

export default es
