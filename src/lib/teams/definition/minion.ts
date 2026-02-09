import { TeamDefinition } from "../types";

const definition: TeamDefinition = {
    id: "minion",
    icon: "swords",
    isEvil: true,
    colors: {
        cardBg: "bg-gradient-to-b from-grimoire-dark to-grimoire-blood",
        cardBorder: "border-orange-500/40",
        cardText: "text-parchment-100",
        cardGlow: "rgba(234, 140, 30, 0.35)",
        cardShimmer: "rgba(255, 160, 50, 0.15)",
        cardSealRing: "border-orange-400/15",
        cardIconBg: "bg-orange-900/30 border border-orange-500/40",
        cardIconGlow: "0 0 12px rgba(234,140,30,0.5)",
        cardDividerIcon: "flame",
        cardWinBg: "bg-orange-950/50 border border-orange-500/30",
        cardWinAccent: "text-orange-400",
        cardTeamBadge: "text-orange-400/70",
        gradient: "from-orange-950 via-red-950 to-orange-950",
        buttonGradient: "from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800",
        text: "text-orange-400",
        accent: "text-orange-400",
        badge: "bg-orange-500/20 border-orange-400/50",
        badgeText: "text-orange-200",
    },
};

export default definition;
