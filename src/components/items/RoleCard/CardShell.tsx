import React, { ReactNode } from "react";
import { getTeam, TeamId } from "../../../lib/teams";
import { cn } from "../../../lib/utils";
import { Icon } from "../../atoms";
import { IconName } from "../../atoms/icon";
import { TownsfolkParticles, MinionParticles } from "./CardParticles";

// ─── Corner icon decorations ─────────────────────────────────────────────────

const CORNER_POSITIONS = {
    tl: "top-4 left-4 -rotate-45",
    tr: "top-4 right-4 rotate-45",
    bl: "bottom-4 left-4 -rotate-[135deg]",
    br: "bottom-4 right-4 rotate-[135deg]",
} as const;

function CornerIcon({
    position,
    icon,
    className,
}: {
    position: keyof typeof CORNER_POSITIONS;
    icon: IconName;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "absolute flex items-center justify-center text-mystic-gold/50",
                CORNER_POSITIONS[position],
            )}
        >
            <Icon name={icon} size="sm" className={className} />
        </div>
    );
}

// ─── Frame class resolver ────────────────────────────────────────────────────

function getFrameClass(teamId: TeamId): string {
    switch (teamId) {
        case "demon":
            return "card-frame-demon";
        case "minion":
            return "card-frame-minion";
        case "outsider":
            return "card-frame-outsider";
        default:
            return "card-frame-townsfolk";
    }
}

// ─── CardShell ───────────────────────────────────────────────────────────────

type CardShellProps = {
    teamId: TeamId;
    icon: IconName;
    children: ReactNode;
};

/**
 * Shared card shell with team-themed visual flair.
 *
 * Provides the animated outer wrapper, holographic shimmer, border glow,
 * team-specific particles and frames, corner icons, and parchment-textured
 * content area.
 *
 * Used by both `RoleCard` (role reveals) and `OracleCard` (info reveals).
 */
export function CardShell({ teamId, icon, children }: CardShellProps) {
    const team = getTeam(teamId);

    return (
        <div
            className="animate-card-summon w-full max-w-sm mx-auto"
            style={
                {
                    "--glow-color": team.colors.cardGlow,
                    "--shimmer-color": team.colors.cardShimmer,
                } as React.CSSProperties
            }
        >
            <div
                className={cn(
                    "animate-card-float card-border-glow relative rounded-xl border-2 overflow-hidden",
                    team.colors.cardBg,
                    team.colors.cardBorder,
                )}
            >
                {/* Holographic foil shimmer overlay */}
                <div className="card-shimmer" />

                {/* Team-specific overlays */}
                {teamId === "demon" && <div className="card-scanlines" />}
                {teamId === "minion" && <MinionParticles />}
                {teamId === "townsfolk" && <TownsfolkParticles />}

                {/* Inner decorative border — team-specific frame style */}
                <div
                    className={cn(
                        "absolute inset-4 rounded-lg pointer-events-none",
                        getFrameClass(teamId),
                    )}
                />

                {/* Corner Icons */}
                {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                    <CornerIcon
                        key={pos}
                        position={pos}
                        icon={icon}
                        className={team.colors.accent}
                    />
                ))}

                {/* Card Content */}
                <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-10 bg-parchment-texture">
                    {children}
                </div>
            </div>
        </div>
    );
}
