import { ReactNode } from "react";
import { getTeam, TeamId } from "../../lib/teams";
import { cn } from "../../lib/utils";
import { Icon } from "../atoms";
import { IconName } from "../atoms/icon";
import { MysticDivider } from "./MysticDivider";
import { CardShell } from "./RoleCard/CardShell";
import { CardIcon } from "./RoleCard/CardIcon";

// ─── OracleCard ──────────────────────────────────────────────────────────────

type OracleCardProps = {
    icon: IconName;
    teamId: TeamId;
    title: string;
    subtitle: string;
    children: ReactNode;
};

/**
 * Tarot-style information card with team-specific visual flair.
 *
 * Shares the same animated card shell as `RoleCard` (summon animation,
 * 3D float, holographic shimmer, border glow, particles, decorative frames)
 * but displays ability results instead of role identity.
 *
 * The `teamId` drives all visual theming — pass it dynamically based on
 * the result (e.g., townsfolk for safe, minion/demon for danger) to make
 * the card atmosphere communicate the information.
 *
 * Wrap in a `TeamBackground` for the full immersive experience.
 */
export function OracleCard({
    icon,
    teamId,
    title,
    subtitle,
    children,
}: OracleCardProps) {
    const team = getTeam(teamId);

    return (
        <CardShell teamId={teamId} icon={icon}>
            {/* Icon with arcane seal */}
            <CardIcon icon={icon} teamId={teamId} />

            {/* Title */}
            <h1
                className={cn(
                    "font-tarot text-2xl sm:text-3xl font-bold text-center uppercase tracking-widest-xl mb-2",
                    team.colors.cardText,
                )}
                style={{ textShadow: team.colors.cardIconGlow }}
            >
                {title}
            </h1>

            {/* Subtitle (role name) */}
            <p
                className={cn(
                    "text-center text-xs tracking-widest uppercase mb-4 sm:mb-6",
                    team.colors.cardTeamBadge,
                )}
            >
                {subtitle}
            </p>

            {/* Divider — team-specific icon */}
            <MysticDivider
                icon={team.colors.cardDividerIcon}
                iconClassName={cn(
                    team.colors.cardWinAccent,
                    "opacity-50",
                )}
            />

            {/* Result content */}
            {children}
        </CardShell>
    );
}

// ─── NumberReveal ────────────────────────────────────────────────────────────

type NumberRevealProps = {
    value: number;
    label: string;
    teamId: TeamId;
};

/**
 * Large dramatic number display for oracle cards.
 * Used by Chef (evil pairs) and Empath (evil neighbors).
 */
export function NumberReveal({ value, label, teamId }: NumberRevealProps) {
    const team = getTeam(teamId);

    return (
        <div className="text-center py-2 sm:py-4">
            {/* Label */}
            <p
                className={cn(
                    "text-sm tracking-wide mb-4 sm:mb-6 opacity-80",
                    team.colors.cardText,
                )}
            >
                {label}
            </p>

            {/* Large number */}
            <div
                className={cn(
                    "inline-flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 rounded-full",
                    team.colors.cardWinBg,
                )}
            >
                <span
                    className={cn(
                        "font-tarot text-5xl sm:text-7xl font-bold",
                        team.colors.cardWinAccent,
                    )}
                    style={{ textShadow: team.colors.cardIconGlow }}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

// ─── VisionReveal ────────────────────────────────────────────────────────────

type VisionRevealProps = {
    players: [string, string];
    verdict: string;
    verdictIcon: IconName;
    teamId: TeamId;
};

/**
 * Dramatic vision display for the Fortune Teller oracle card.
 * Shows the two checked player names and a verdict message.
 */
export function VisionReveal({
    players,
    verdict,
    verdictIcon,
    teamId,
}: VisionRevealProps) {
    const team = getTeam(teamId);

    return (
        <div className="text-center py-2 sm:py-4">
            {/* Player name cards */}
            <div className="space-y-2 mb-5 sm:mb-6">
                {players.map((name, i) => (
                    <div
                        key={i}
                        className={cn(
                            "px-4 py-2.5 rounded-lg border text-center",
                            team.colors.cardWinBg,
                        )}
                    >
                        <span
                            className={cn(
                                "font-tarot text-lg tracking-wide uppercase",
                                team.colors.cardText,
                            )}
                        >
                            {name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Verdict */}
            <div className="flex flex-col items-center gap-2">
                <Icon
                    name={verdictIcon}
                    size="xl"
                    className={team.colors.cardWinAccent}
                />
                <p
                    className={cn(
                        "font-tarot text-lg sm:text-xl uppercase tracking-wider leading-relaxed",
                        team.colors.cardText,
                    )}
                    style={{ textShadow: team.colors.cardIconGlow }}
                >
                    {verdict}
                </p>
            </div>
        </div>
    );
}
