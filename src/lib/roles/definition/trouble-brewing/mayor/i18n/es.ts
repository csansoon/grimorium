const es = {
  name: 'Alcalde',
  description:
    'Si solo quedan 3 jugadores vivos y no hay ejecución, tu equipo gana. Si mueres de noche, otro jugador podría morir en tu lugar.',
  quote: 'El pueblo perdura porque alguien debe mantener la línea.',
  lines: [
    { type: 'PASSIVE', text: 'Si solo quedan 3 jugadores vivos y no hay ejecución durante el día, el bien gana.' },
    { type: 'PROTECT', text: 'Si el demonio intenta matarte de noche, es posible que muera otro jugador en tu lugar.' },
    { type: 'WIN', text: 'Ejecuta al Demonio — o sobrevive hasta la victoria pacífica.' },
  ],
} as const

export default es
