const es = {
  name: 'Matematico',
  description:
    'Cada noche, aprendes cuantas habilidades funcionaron de forma anomala por culpa de otro personaje.',
  quote: 'Los numeros no mienten, aunque las razones detras de ellos si puedan hacerlo.',
  lines: [
    { type: 'NIGHT', text: 'Cada noche, aprendes cuantas habilidades fallaron por culpa de otro personaje.' },
    { type: 'INFO', text: 'Es un unico numero elegido por el Narrador.' },
    { type: 'WIN', text: 'Usa los cambios en el conteo para encontrar venenos, embriaguez e interacciones raras.' },
  ],
  infoTitle: 'Matematico',
  countLabel: 'Habilidades anormales',
  configureTitle: 'Configurar Matematico',
  configureDescription: 'Elige cuantas habilidades funcionaron mal esta noche.',
  configureConfirm: 'Mostrar resultado',
} as const

export default es
