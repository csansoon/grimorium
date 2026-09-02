const es = {
  name: 'Artista',
  description: 'Una vez por partida, durante el dia, haz en privado al Narrador cualquier pregunta de si o no.',
  quote: 'Una sola linea honesta puede abrir todo el lienzo.',
  lines: [
    { type: 'ONCE', text: 'Una vez por partida, durante el dia, haz una pregunta de si o no.' },
    { type: 'INFO', text: 'El Narrador responde con la verdad.' },
    { type: 'WIN', text: 'Guardala para la pregunta que cambie toda la mesa.' },
  ],
} as const

export default es
