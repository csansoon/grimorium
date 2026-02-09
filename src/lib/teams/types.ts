import { IconName } from "../../components/atoms/icon";

export type TeamId = "townsfolk" | "outsider" | "minion" | "demon";

export type TeamDefinition = {
    id: TeamId;
    icon: IconName;
    isEvil: boolean;
    colors: {
        // For tarot card backgrounds
        cardBg: string;
        cardBorder: string;
        cardText: string;
        // Card decorative accents
        cardGlow: string; // CSS color for animated border glow
        cardShimmer: string; // CSS color for holographic foil shimmer
        cardSealRing: string; // Tailwind classes for the rotating arcane seal
        cardIconBg: string; // Tailwind classes for icon circle background
        cardIconGlow: string; // CSS text-shadow for the icon glow
        cardDividerIcon: IconName; // Icon used in the MysticDivider
        cardWinBg: string; // Tailwind classes for win-condition box
        cardWinAccent: string; // Tailwind classes for win-condition accent text/icon
        cardTeamBadge: string; // Tailwind classes for the team name text
        // For general UI
        gradient: string;
        buttonGradient: string;
        text: string;
        accent: string;
        badge: string;
        badgeText: string;
    };
};
