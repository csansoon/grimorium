const es = {
  name: 'Oraculo',
  description: 'Cada noche, aprendes cuantos jugadores muertos son malvados.',
  quote: 'Los muertos siguen hablando. Tu solo sabes contarlos.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche despues de la primera, aprendes cuantos jugadores muertos son malvados.' },
    { type: 'INFO', text: 'Este numero cambia a medida que se acumulan las muertes.' },
    { type: 'WIN', text: 'Usa a los muertos para medir cuanto mal ya ha quedado expuesto.' },
  ],
  infoTitle: 'Oraculo',
  countLabel: 'Jugadores muertos malvados',
  configureTitle: 'Configurar Oraculo',
  configureDescription: 'Revisa y ajusta el numero antes de mostrar el resultado.',
  configureConfirm: 'Mostrar resultado',
} as const

export default es
