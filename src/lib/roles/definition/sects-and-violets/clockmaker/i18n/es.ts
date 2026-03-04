const es = {
  name: 'Relojero',
  description: 'Comienzas sabiendo a cuanta distancia esta el Demonio de su Secuaz mas cercano.',
  quote: 'Cada asiento es una marca del reloj; cada mentira, un engranaje.',
  lines: [
    { type: 'FIRST', text: 'La primera noche, aprendes la distancia mas corta entre el Demonio y cualquier Secuaz.' },
    { type: 'INFO', text: 'La distancia se cuenta alrededor del circulo de asientos.' },
    { type: 'WIN', text: 'Usa esa separacion para reducir rapido al equipo malvado.' },
  ],
  infoTitle: 'Relojero',
  distanceLabel: 'Distancia al Secuaz mas cercano',
  configureTitle: 'Configurar Relojero',
  configureDescription: 'Elige la distancia que se mostrara si el Relojero esta afectado.',
  configureConfirm: 'Mostrar resultado',
} as const

export default es
