import { TeamDefinition } from '../types'

const definition: TeamDefinition = {
  id: 'outsider',
  icon: 'userX',
  isEvil: false,
  colors: {
    cardBg: 'bg-gradient-to-b from-parchment-100 to-parchment-300',
    cardBorder: 'border-mystic-silver/40',
    cardText: 'text-grimoire-dark',
    cardGlow: 'rgba(192, 192, 192, 0.3)',
    cardShimmer: 'rgba(180, 200, 220, 0.18)',
    cardSealRing: 'border-mystic-silver/15',
    cardIconBg: 'bg-mystic-silver/10 border border-mystic-silver/30',
    cardIconGlow: '0 0 12px rgba(192,192,192,0.45)',
    cardDividerIcon: 'diamond',
    cardWinBg: 'bg-mystic-silver/10 border border-mystic-silver/20',
    cardWinAccent: 'text-mystic-silver',
    cardTeamBadge: 'text-mystic-silver/70',
    gradient: 'from-slate-950 via-cyan-950 to-slate-950',
    buttonGradient:
      'from-mystic-silver to-slate-400 hover:from-slate-400 hover:to-mystic-silver',
    text: 'text-cyan-300',
    accent: 'text-mystic-silver',
    badge: 'bg-cyan-500/20 border-cyan-400/50',
    badgeText: 'text-cyan-200',
  },
}

export default definition
