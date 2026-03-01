const es = {
  name: 'Aldeano',
  description:
    'No tienes ninguna habilidad. ¡Pero sigues siendo una buena persona! Ayuda a tu pueblo a encontrar al Demonio.',
  quote: 'La fuerza del pueblo está en su gente. Cada voz cuenta.',
  lines: [
    { type: 'PASSIVE', text: 'No tienes ninguna habilidad especial.' },
    { type: 'ADVICE', text: 'Escucha, debate y usa tu voto sabiamente — tu juicio es tu arma.' },
    { type: 'WIN', text: 'Ejecuta al Demonio para ganar.' },
  ],
} as const

export default es
