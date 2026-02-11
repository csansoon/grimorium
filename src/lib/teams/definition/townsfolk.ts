import { TeamDefinition } from '../types'

const definition: TeamDefinition = {
  id: 'townsfolk',
  icon: 'users',
  isEvil: false,
  colors: {
    cardBg: 'bg-gradient-to-b from-parchment-100 to-parchment-200',
    cardBorder: 'border-mystic-gold/40',
    cardText: 'text-grimoire-dark',
    cardGlow: 'rgba(212, 175, 55, 0.35)',
    cardShimmer: 'rgba(212, 175, 55, 0.18)',
    cardSealRing: 'border-mystic-gold/15',
    cardIconBg: 'bg-mystic-gold/10 border border-mystic-gold/30',
    cardIconGlow: '0 0 12px rgba(212,175,55,0.5)',
    cardDividerIcon: 'sparkles',
    cardWinBg: 'bg-mystic-gold/10 border border-mystic-gold/20',
    cardWinAccent: 'text-mystic-gold',
    cardTeamBadge: 'text-mystic-gold/70',
    gradient: 'from-indigo-950 via-blue-950 to-indigo-950',
    buttonGradient:
      'from-mystic-gold to-mystic-bronze hover:from-mystic-bronze hover:to-mystic-gold',
    text: 'text-blue-300',
    accent: 'text-mystic-gold',
    badge: 'bg-blue-500/20 border-blue-400/50',
    badgeText: 'text-blue-200',
  },
}

export default definition
