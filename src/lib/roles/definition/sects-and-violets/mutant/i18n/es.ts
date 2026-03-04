const es = {
  name: 'Mutante',
  description: 'Si actúas como si fueras un Forastero, podrían ejecutarte.',
  quote: 'Oculta lo que eres, o sufre por ello.',
  lines: [
    { type: 'CAVEAT', text: 'El Narrador decide si rompes la locura.' },
    { type: 'ADVICE', text: 'Prepara una afirmación que no insinúe Forastero.' },
    { type: 'BLUFF', text: 'Compórtate como un rol con una razón creíble para ser cauto.' },
  ],
} as const

export default es
