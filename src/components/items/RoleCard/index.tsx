import { getRole } from "../../../lib/roles";
import { getTeam, TeamId } from "../../../lib/teams";
import { useI18n } from "../../../lib/i18n";
import { Icon, type IconName } from "../../atoms";
import { MysticDivider } from "..";
import { cn } from "../../../lib/utils";
import { RoleIcon } from "./RoleIcon";

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

type Props = {
    roleId: string;
};

// ─── Team-specific particle decorations ─────────────────────────────────────

/** Faint twinkling stars scattered across the card for Townsfolk */
function TownsfolkParticles() {
    const stars = [
        { top: "12%", left: "15%", duration: "3.5s", delay: "0s" },
        { top: "28%", left: "82%", duration: "4.2s", delay: "1.2s" },
        { top: "55%", left: "8%", duration: "3.8s", delay: "0.5s" },
        { top: "72%", left: "75%", duration: "4.5s", delay: "2.0s" },
        { top: "88%", left: "35%", duration: "3.2s", delay: "1.7s" },
        { top: "40%", left: "92%", duration: "4.0s", delay: "0.8s" },
    ];
    return (
        <>
            {stars.map((s, i) => (
                <div
                    key={i}
                    className="card-star-particle"
                    style={
                        {
                            top: s.top,
                            left: s.left,
                            "--star-duration": s.duration,
                            "--star-delay": s.delay,
                        } as React.CSSProperties
                    }
                />
            ))}
        </>
    );
}

/** Rising ember particles for Minion cards */
function MinionParticles() {
    const embers = [
        { bottom: "8%", left: "20%", duration: "3.5s", delay: "0s" },
        { bottom: "5%", left: "55%", duration: "4.0s", delay: "0.8s" },
        { bottom: "12%", left: "78%", duration: "3.2s", delay: "1.5s" },
        { bottom: "3%", left: "38%", duration: "4.5s", delay: "2.2s" },
        { bottom: "6%", left: "90%", duration: "3.8s", delay: "0.3s" },
    ];
    return (
        <>
            {embers.map((e, i) => (
                <div
                    key={i}
                    className="card-ember-particle"
                    style={
                        {
                            bottom: e.bottom,
                            left: e.left,
                            "--ember-duration": e.duration,
                            "--ember-delay": e.delay,
                        } as React.CSSProperties
                    }
                />
            ))}
        </>
    );
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * Tarot-style role card with team-specific visual flair.
 *
 * Each team gets its own decorative personality:
 *  - **Townsfolk** — golden glow, twinkling stars, elegant double-line frame
 *  - **Outsider** — silver shimmer, fractured dashed frame, prismatic feel
 *  - **Minion** — ember glow, rising fire particles, smoldering frame
 *  - **Demon** — crimson pulse, scan-line interference, sigil geometry
 *
 * Features a holographic foil shimmer, animated border glow, rotating arcane
 * seal behind the icon, and a dramatic summon animation on mount.
 *
 * This is a pure presentational component — it renders only the card itself.
 * Wrap it in a `TeamBackground` and add context text / action links as siblings.
 */
export function RoleCard({ roleId }: Props) {
    const { t } = useI18n();
    const role = getRole(roleId);

    if (!role) {
        return (
            <p className="text-red-400 font-tarot text-center p-4">
                Unknown role: {roleId}
            </p>
        );
    }

    const team = getTeam(role.team);
    const roleKey = role.id as keyof typeof t.roles;
    const teamId = role.team as TeamId;

    const roleTranslation = t.roles[roleKey];
    const teamTranslation = t.teams[teamId];

    const roleName = roleTranslation?.name ?? roleKey;
    const roleDescription = roleTranslation?.description ?? "";
    const teamName = teamTranslation?.name ?? teamId;
    const winCondition = teamTranslation?.winCondition ?? "";

    const frameClass =
        teamId === "demon"
            ? "card-frame-demon"
            : teamId === "minion"
              ? "card-frame-minion"
              : teamId === "outsider"
                ? "card-frame-outsider"
                : "card-frame-townsfolk";

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
                        frameClass,
                    )}
                />

                {/* Corner Icons */}
                {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                    <CornerIcon
                        key={pos}
                        position={pos}
                        icon={role.icon}
                        className={team.colors.accent}
                    />
                ))}

                {/* Card Content */}
                <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-10 bg-parchment-texture">
                    {/* Role Icon with arcane seal */}
                    <RoleIcon role={role} />

                    {/* Role Name */}
                    <h1
                        className={cn(
                            "font-tarot text-2xl sm:text-3xl font-bold text-center uppercase tracking-widest-xl mb-2",
                            team.colors.cardText,
                        )}
                        style={{ textShadow: team.colors.cardIconGlow }}
                    >
                        {roleName}
                    </h1>

                    {/* Team Badge */}
                    <p
                        className={cn(
                            "text-center text-xs tracking-widest uppercase mb-4 sm:mb-6",
                            team.colors.cardTeamBadge,
                        )}
                    >
                        {teamName}
                    </p>

                    {/* Divider — team-specific icon */}
                    <MysticDivider
                        icon={team.colors.cardDividerIcon}
                        iconClassName={cn(
                            team.colors.cardWinAccent,
                            "opacity-50",
                        )}
                    />

                    {/* Description */}
                    <p
                        className={cn(
                            "text-center text-sm leading-relaxed mb-4 sm:mb-6",
                            team.colors.cardText,
                            "opacity-80",
                        )}
                    >
                        {roleDescription}
                    </p>

                    {/* Win Condition */}
                    <div
                        className={cn(
                            "rounded-lg p-3 sm:p-4",
                            team.colors.cardWinBg,
                        )}
                    >
                        <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                            <Icon
                                name="trophy"
                                size="sm"
                                className={team.colors.cardWinAccent}
                            />
                            <span
                                className={cn(
                                    "text-xs font-semibold uppercase tracking-wider",
                                    team.colors.cardWinAccent,
                                )}
                            >
                                {t.common.winCondition}
                            </span>
                        </div>
                        <p
                            className={cn(
                                "text-center text-xs leading-relaxed",
                                team.colors.cardText,
                                "opacity-70",
                            )}
                        >
                            {winCondition}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
