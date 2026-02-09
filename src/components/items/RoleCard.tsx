import { getRole } from "../../lib/roles";
import { getTeam, TeamId } from "../../lib/teams";
import { useI18n } from "../../lib/i18n";
import { Icon } from "../atoms";
import { MysticDivider } from "../items";
import { cn } from "../../lib/utils";

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
                    style={{
                        top: s.top,
                        left: s.left,
                        "--star-duration": s.duration,
                        "--star-delay": s.delay,
                    } as React.CSSProperties}
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
                    style={{
                        bottom: e.bottom,
                        left: e.left,
                        "--ember-duration": e.duration,
                        "--ember-delay": e.delay,
                    } as React.CSSProperties}
                />
            ))}
        </>
    );
}

// ─── Arcane seal rings behind the icon ──────────────────────────────────────

function ArcaneSeal({ teamId }: { teamId: TeamId }) {
    const team = getTeam(teamId);

    // Build tick marks — more marks = more ornate
    const outerTicks = teamId === "demon" ? 12 : 8;
    const innerTicks = teamId === "outsider" ? 6 : 4;

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer seal ring */}
            <div
                className={cn(
                    "card-seal-outer absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full border",
                    team.colors.cardSealRing,
                )}
            >
                {/* Tick marks around the ring */}
                {Array.from({ length: outerTicks }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
                        style={{ transform: `rotate(${(360 / outerTicks) * i}deg)` }}
                    >
                        <div
                            className={cn(
                                "w-px h-2 mx-auto",
                                teamId === "demon"
                                    ? "bg-red-500/20"
                                    : teamId === "minion"
                                      ? "bg-orange-400/15"
                                      : teamId === "outsider"
                                        ? "bg-mystic-silver/15"
                                        : "bg-mystic-gold/15",
                            )}
                        />
                    </div>
                ))}
            </div>

            {/* Inner seal ring */}
            <div
                className={cn(
                    "card-seal-inner absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border",
                    team.colors.cardSealRing,
                )}
            >
                {Array.from({ length: innerTicks }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
                        style={{ transform: `rotate(${(360 / innerTicks) * i}deg)` }}
                    >
                        <div
                            className={cn(
                                "w-px h-1.5 mx-auto",
                                teamId === "demon"
                                    ? "bg-red-500/15"
                                    : teamId === "minion"
                                      ? "bg-orange-400/10"
                                      : teamId === "outsider"
                                        ? "bg-mystic-silver/10"
                                        : "bg-mystic-gold/10",
                            )}
                        />
                    </div>
                ))}
            </div>
        </div>
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
            style={{
                "--glow-color": team.colors.cardGlow,
                "--shimmer-color": team.colors.cardShimmer,
            } as React.CSSProperties}
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
            <div className="tarot-corner tarot-corner-tl">
                <Icon name={role.icon} size="sm" className={team.colors.accent} />
            </div>
            <div className="tarot-corner tarot-corner-tr">
                <Icon name={role.icon} size="sm" className={team.colors.accent} />
            </div>
            <div className="tarot-corner tarot-corner-bl">
                <Icon name={role.icon} size="sm" className={team.colors.accent} />
            </div>
            <div className="tarot-corner tarot-corner-br">
                <Icon name={role.icon} size="sm" className={team.colors.accent} />
            </div>

            {/* Card Content */}
            <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-10 parchment-texture">
                {/* Role Icon with arcane seal */}
                <div className="relative flex justify-center mb-3 sm:mb-6">
                    {/* Rotating arcane seal rings */}
                    <ArcaneSeal teamId={teamId} />

                    {/* Icon circle */}
                    <div
                        className={cn(
                            "relative z-10 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center",
                            team.colors.cardIconBg,
                        )}
                    >
                        <span
                            className={team.colors.cardWinAccent}
                            style={{ filter: `drop-shadow(${team.colors.cardIconGlow})` }}
                        >
                            <Icon
                                name={role.icon}
                                size="2xl"
                                className="sm:w-20 sm:h-20"
                            />
                        </span>
                    </div>
                </div>

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
                    iconClassName={cn(team.colors.cardWinAccent, "opacity-50")}
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
                <div className={cn("rounded-lg p-3 sm:p-4", team.colors.cardWinBg)}>
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
