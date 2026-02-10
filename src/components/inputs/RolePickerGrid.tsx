import { useMemo } from "react";
import { RoleDefinition } from "../../lib/roles/types";
import { getTeam, TeamId } from "../../lib/teams";
import { GameState, PlayerState } from "../../lib/types";
import { getEffect } from "../../lib/effects";
import { useI18n } from "../../lib/i18n";
import { Icon } from "../atoms";
import { IconName } from "../atoms/icon";
import { cn } from "../../lib/utils";

const TEAM_ORDER: TeamId[] = ["townsfolk", "outsider", "minion", "demon"];

type RolePickerGridProps = {
    /** All roles available for selection. Pre-filtered by the caller. */
    roles: RoleDefinition[];

    /** Current game state — used to resolve which players hold each role. */
    state: GameState;

    /** Currently selected role ID(s). */
    selected: string[];

    /** Called when a role is tapped. */
    onSelect: (roleId: string) => void;

    /**
     * How many roles must/can be selected.
     * - A number (e.g. 1, 3) caps selection at that count.
     *   When exactly 1, tapping a new card replaces the previous selection (radio behavior).
     *   When > 1, tapping toggles (checkbox behavior, capped at max).
     * - `null` means free selection (any number).
     */
    selectionCount?: number | null;

    /**
     * Visual variant for the selected card accent.
     * - "team": uses the team colors of each role for its card border/checkmark (default).
     * - "neutral": uses amber/gold tones for all cards regardless of team.
     */
    colorMode?: "neutral" | "team";
};

export function RolePickerGrid({
    roles,
    state,
    selected,
    onSelect,
    selectionCount = 1,
    colorMode = "team",
}: RolePickerGridProps) {
    const { t } = useI18n();

    // Group roles by team
    const rolesByTeam = useMemo(() => {
        const grouped: Record<TeamId, RoleDefinition[]> = {
            townsfolk: [],
            outsider: [],
            minion: [],
            demon: [],
        };
        for (const role of roles) {
            grouped[role.team].push(role);
        }
        return grouped;
    }, [roles]);

    // Build a map of roleId → PlayerState[] for annotations
    const playersByRole = useMemo(() => {
        const map = new Map<string, PlayerState[]>();
        for (const p of state.players) {
            const existing = map.get(p.roleId);
            if (existing) {
                existing.push(p);
            } else {
                map.set(p.roleId, [p]);
            }
        }
        return map;
    }, [state.players]);

    const getRoleName = (roleId: string) => {
        const key = roleId as keyof typeof t.roles;
        return t.roles[key]?.name ?? roleId;
    };

    const getRoleDescription = (roleId: string) => {
        const key = roleId as keyof typeof t.roles;
        const entry = t.roles[key];
        if (entry && "description" in entry) {
            return (entry as { description: string }).description;
        }
        return "";
    };

    const getTeamName = (teamId: TeamId) => {
        const key = teamId as keyof typeof t.teams;
        return t.teams[key]?.name ?? teamId;
    };

    const isAtMax =
        selectionCount !== null &&
        selectionCount !== undefined &&
        selected.length >= selectionCount;

    return (
        <div className="space-y-4">
            {TEAM_ORDER.map((teamId) => {
                const teamRoles = rolesByTeam[teamId];
                if (teamRoles.length === 0) return null;
                const team = getTeam(teamId);

                return (
                    <div key={teamId}>
                        {/* Team Header */}
                        <div className="flex items-center gap-2 mb-2 ml-1">
                            <Icon
                                name={team.icon}
                                size="sm"
                                className={team.colors.text}
                            />
                            <span
                                className={cn(
                                    "text-xs font-tarot tracking-wider uppercase",
                                    team.colors.text,
                                )}
                            >
                                {getTeamName(teamId)}
                            </span>
                        </div>

                        {/* Card Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {teamRoles.map((role) => {
                                const isSelected = selected.includes(role.id);
                                const isDisabled = !isSelected && isAtMax;
                                const assignedPlayers =
                                    playersByRole.get(role.id) ?? [];
                                const desc = getRoleDescription(role.id);

                                // Determine colors based on colorMode
                                const borderClass =
                                    colorMode === "team"
                                        ? team.colors.cardBorder
                                        : "border-amber-500/50";
                                const badgeBg =
                                    colorMode === "team"
                                        ? team.colors.badge
                                        : "bg-amber-500/20";
                                const badgeTextClass =
                                    colorMode === "team"
                                        ? team.colors.badgeText
                                        : "text-amber-200";
                                const iconColor =
                                    colorMode === "team"
                                        ? team.colors.text
                                        : "text-amber-300";

                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => onSelect(role.id)}
                                        className={cn(
                                            "rounded-xl border-2 transition-all relative flex flex-col",
                                            isSelected
                                                ? cn(
                                                      borderClass,
                                                      "bg-gradient-to-b from-white/10 to-white/5",
                                                  )
                                                : "border-white/10 bg-white/5 hover:bg-white/[0.08]",
                                            isDisabled &&
                                                "opacity-40 cursor-not-allowed",
                                        )}
                                        style={
                                            isSelected
                                                ? {
                                                      boxShadow: `0 0 16px ${team.colors.cardGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                                                  }
                                                : undefined
                                        }
                                    >
                                        {/* Card body */}
                                        <div className="px-3 pt-4 pb-3 text-center flex-1">
                                            {/* Selected checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    <div
                                                        className={cn(
                                                            "w-5 h-5 rounded-full flex items-center justify-center",
                                                            badgeBg,
                                                        )}
                                                    >
                                                        <Icon
                                                            name="check"
                                                            size="xs"
                                                            className={
                                                                badgeTextClass
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Role icon medallion */}
                                            <div
                                                className={cn(
                                                    "w-9 h-9 rounded-full flex items-center justify-center mx-auto",
                                                    isSelected
                                                        ? team.colors.cardIconBg
                                                        : "bg-white/5 border border-white/10",
                                                )}
                                            >
                                                <Icon
                                                    name={role.icon}
                                                    size="md"
                                                    className={
                                                        isSelected
                                                            ? iconColor
                                                            : "text-parchment-500"
                                                    }
                                                />
                                            </div>

                                            {/* Role name */}
                                            <div
                                                className={cn(
                                                    "text-[11px] font-tarot tracking-wider uppercase mt-2",
                                                    isSelected
                                                        ? "text-parchment-100"
                                                        : "text-parchment-300",
                                                )}
                                            >
                                                {getRoleName(role.id)}
                                            </div>

                                            {/* Role description */}
                                            {desc && (
                                                <p className="text-[11px] text-parchment-500 line-clamp-2 mt-1 leading-snug text-left">
                                                    {desc}
                                                </p>
                                            )}
                                        </div>

                                        {/* Player footer — only when players are assigned */}
                                        {assignedPlayers.length > 0 && (
                                            <div className="border-t border-white/10 px-2 py-1.5 space-y-0.5">
                                                {assignedPlayers.map((p) => (
                                                    <PlayerRow
                                                        key={p.id}
                                                        player={p}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// PLAYER ROW (card footer)
// ============================================================================

function PlayerRow({ player }: { player: PlayerState }) {
    // Get visible effect icons (skip internal/hidden effects)
    const effectIcons = player.effects
        .map((e) => {
            const def = getEffect(e.type);
            return def ? { id: e.type, icon: def.icon as IconName } : null;
        })
        .filter(
            (e): e is { id: string; icon: IconName } => e !== null,
        );

    return (
        <div className="flex items-center gap-1 min-w-0">
            <Icon name="user" size="xs" className="text-parchment-500 flex-shrink-0" />
            <span className="text-[11px] text-parchment-400 truncate flex-1">
                {player.name}
            </span>
            {effectIcons.length > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {effectIcons.map((e) => (
                        <Icon
                            key={e.id}
                            name={e.icon}
                            size="xs"
                            className="text-parchment-600"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
