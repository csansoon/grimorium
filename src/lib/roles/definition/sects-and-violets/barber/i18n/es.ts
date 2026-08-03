const es = {
  name: 'Barbero',
  description: 'Si moriste hoy o esta noche, el Demonio puede intercambiar los personajes de 2 jugadores.',
  quote: 'Una mano afilada puede hacer que todos parezcan distintos.',
  lines: [
    { type: 'CAVEAT', text: 'El Demonio decide si usa tu muerte.' },
    { type: 'ADVICE', text: 'Tu muerte puede reescribir por completo la partida.' },
    { type: 'BLUFF', text: 'Observa quién podría beneficiarse de un intercambio repentino.' },
  ],
} as const

export default es
