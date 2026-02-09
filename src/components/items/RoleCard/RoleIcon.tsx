import { RoleDefinition } from "../../../lib/roles";
import { getTeam, TeamDefinition } from "../../../lib/teams";
import { cn } from "../../../lib/utils";
import { Icon } from "../../atoms";

function ArcaneSeal({ team }: { team: TeamDefinition }) {
    // Build tick marks — more marks = more ornate
    const outerTicks = team.id === "demon" ? 12 : 8;
    const innerTicks = team.id === "outsider" ? 6 : 4;

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer seal ring */}
            <div
                className={cn(
                    "card-seal-outer absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border",
                    team.colors.cardSealRing,
                )}
            >
                {/* Tick marks around the ring */}
                {Array.from({ length: outerTicks }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
                        style={{
                            transform: `rotate(${(360 / outerTicks) * i}deg)`,
                        }}
                    >
                        <div
                            className={cn(
                                "w-px h-2 mx-auto",
                                team.id === "demon"
                                    ? "bg-red-500/20"
                                    : team.id === "minion"
                                      ? "bg-orange-400/15"
                                      : team.id === "outsider"
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
                        style={{
                            transform: `rotate(${(360 / innerTicks) * i}deg)`,
                        }}
                    >
                        <div
                            className={cn(
                                "w-px h-1.5 mx-auto",
                                team.id === "demon"
                                    ? "bg-red-500/15"
                                    : team.id === "minion"
                                      ? "bg-orange-400/10"
                                      : team.id === "outsider"
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

export function RoleIcon({ role }: { role: RoleDefinition }) {
    const team = getTeam(role.team);
    return (
        <div className="relative flex justify-center mb-3 sm:mb-6">
            {/* Rotating arcane seal rings */}
            <ArcaneSeal team={team} />

            {/* Icon circle */}
            <div
                className={cn(
                    "relative z-10 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center",
                    team.colors.cardIconBg,
                )}
            >
                <span
                    className={team.colors.cardWinAccent}
                    style={{
                        filter: `drop-shadow(${team.colors.cardIconGlow})`,
                    }}
                >
                    <Icon
                        name={role.icon}
                        size="2xl"
                        className="sm:w-20 sm:h-20"
                    />
                </span>
            </div>
        </div>
    );
}
