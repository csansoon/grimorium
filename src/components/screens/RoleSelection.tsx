import { useState } from "react";
import {
    ROLES,
    SCRIPTS,
    ScriptId,
    getRecommendedDistribution,
} from "../../lib/roles";
import { RoleDefinition } from "../../lib/roles/types";
import { getTeam, TeamId } from "../../lib/teams";
import { useI18n, interpolate } from "../../lib/i18n";
import { Button, Icon, Badge, BackButton } from "../atoms";
import { ScreenFooter } from "../layouts/ScreenFooter";
import { cn } from "../../lib/utils";

type Props = {
    players: string[];
    onNext: (selectedRoles: string[]) => void;
    onBack: () => void;
};

export function RoleSelection({ players, onNext, onBack }: Props) {
    const { t } = useI18n();
    const [roleCounts, setRoleCounts] = useState<Record<string, number>>(
        () => {
            return { imp: 1 };
        }
    );
    const [openScripts, setOpenScripts] = useState<Set<ScriptId>>(
        () => new Set(Object.keys(SCRIPTS) as ScriptId[])
    );

    const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);
    const impCount = roleCounts["imp"] ?? 0;
    const recommended = getRecommendedDistribution(players.length);

    const toggleRole = (roleId: string) => {
        const current = roleCounts[roleId] ?? 0;
        if (current === 0) {
            setRoleCounts({ ...roleCounts, [roleId]: 1 });
        } else {
            const newCounts = { ...roleCounts };
            delete newCounts[roleId];
            setRoleCounts(newCounts);
        }
    };

    const incrementRole = (roleId: string) => {
        setRoleCounts({
            ...roleCounts,
            [roleId]: (roleCounts[roleId] ?? 0) + 1,
        });
    };

    const decrementRole = (roleId: string) => {
        const current = roleCounts[roleId] ?? 0;
        if (current > 1) {
            setRoleCounts({ ...roleCounts, [roleId]: current - 1 });
        } else if (current === 1) {
            const newCounts = { ...roleCounts };
            delete newCounts[roleId];
            setRoleCounts(newCounts);
        }
    };

    const toggleScript = (scriptId: ScriptId) => {
        const next = new Set(openScripts);
        if (next.has(scriptId)) next.delete(scriptId);
        else next.add(scriptId);
        setOpenScripts(next);
    };

    const handleNext = () => {
        const selectedRoles: string[] = [];
        for (const [roleId, count] of Object.entries(roleCounts)) {
            for (let i = 0; i < count; i++) {
                selectedRoles.push(roleId);
            }
        }
        onNext(selectedRoles);
    };

    const canProceed = totalRoles >= players.length && impCount >= 1;

    // Get roles by script and team
    const getScriptRolesByTeam = (scriptId: ScriptId) => {
        const script = SCRIPTS[scriptId];
        const scriptRoles = script.roles.map((id) => ROLES[id]);
        const result: Record<TeamId, RoleDefinition[]> = {
            townsfolk: [],
            outsider: [],
            minion: [],
            demon: [],
        };
        for (const role of scriptRoles) {
            result[role.team].push(role);
        }
        return result;
    };

    const getRoleName = (role: RoleDefinition) => {
        const roleId = role.id as keyof typeof t.roles;
        return t.roles[roleId]?.name ?? role.id;
    };

    const getRoleDescription = (role: RoleDefinition) => {
        const roleId = role.id as keyof typeof t.roles;
        return t.roles[roleId]?.description ?? "";
    };

    const getTeamName = (teamId: string) => {
        const key = teamId as keyof typeof t.teams;
        return t.teams[key]?.name ?? teamId;
    };

    const getScriptName = (scriptId: ScriptId) => {
        const key = scriptId as keyof typeof t.scripts;
        return t.scripts[key] ?? scriptId;
    };

    // Count currently selected roles per team
    const getTeamCounts = () => {
        const counts: Record<TeamId, number> = {
            townsfolk: 0,
            outsider: 0,
            minion: 0,
            demon: 0,
        };
        for (const [roleId, count] of Object.entries(roleCounts)) {
            const role = ROLES[roleId as keyof typeof ROLES];
            if (role) {
                counts[role.team] += count;
            }
        }
        return counts;
    };

    const teamCounts = getTeamCounts();
    const teamOrder: TeamId[] = ["townsfolk", "outsider", "minion", "demon"];

    return (
        <div className="min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3">
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    <BackButton onClick={onBack} />
                    <div className="flex-1">
                        <h1 className="font-tarot text-lg text-parchment-100 tracking-wider uppercase">
                            {t.newGame.step2Title}
                        </h1>
                        <p className="text-xs text-parchment-500">
                            {t.newGame.step2Subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommendation bar */}
            {recommended && (
                <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Icon
                                name="sparkles"
                                size="sm"
                                className="text-mystic-gold/70"
                            />
                            <span className="text-xs text-parchment-400 font-medium">
                                {t.newGame.suggested} ({players.length}{" "}
                                {t.common.players.toLowerCase()}):
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {teamOrder.map((teamId) => {
                                const count = recommended[teamId];
                                const currentCount = teamCounts[teamId];
                                const isMatch = currentCount === count;
                                return (
                                    <Badge
                                        key={teamId}
                                        variant={teamId}
                                        className={cn(
                                            "text-[10px] px-2 py-0.5",
                                            isMatch && "ring-1 ring-green-400/50"
                                        )}
                                    >
                                        {count} {getTeamName(teamId)}
                                        {totalRoles > 0 && (
                                            <span className="opacity-60 ml-0.5">
                                                ({currentCount})
                                            </span>
                                        )}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Warnings */}
            {totalRoles > 0 &&
                (totalRoles < players.length || impCount < 1) && (
                    <div className="px-4 py-2 bg-mystic-crimson/20 border-b border-red-500/30">
                        <div className="max-w-lg mx-auto space-y-1">
                            {totalRoles < players.length && (
                                <div className="flex items-center gap-2 text-red-300 text-xs">
                                    <Icon name="alertTriangle" size="sm" />
                                    {interpolate(t.newGame.needAtLeastRoles, {
                                        count: players.length,
                                    })}
                                </div>
                            )}
                            {impCount < 1 && (
                                <div className="flex items-center gap-2 text-red-300 text-xs">
                                    <Icon name="alertTriangle" size="sm" />
                                    {t.newGame.needAtLeastImp}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            {/* Content */}
            <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto">
                {(Object.keys(SCRIPTS) as ScriptId[]).map((scriptId) => {
                    const rolesByTeam = getScriptRolesByTeam(scriptId);
                    const isOpen = openScripts.has(scriptId);

                    return (
                        <div key={scriptId} className="mb-6">
                            {/* Script Header (Collapsible) */}
                            <button
                                onClick={() => toggleScript(scriptId)}
                                className="w-full flex items-center gap-2 mb-4 pb-2 border-b border-mystic-gold/30"
                            >
                                <Icon
                                    name="scrollText"
                                    size="md"
                                    className="text-mystic-gold"
                                />
                                <span className="text-base font-tarot tracking-wider uppercase text-mystic-gold flex-1 text-left">
                                    {getScriptName(scriptId)}
                                </span>
                                <Icon
                                    name={isOpen ? "chevronUp" : "chevronDown"}
                                    size="sm"
                                    className="text-mystic-gold/60"
                                />
                            </button>

                            {isOpen &&
                                teamOrder.map((teamId) => {
                                    const roles = rolesByTeam[teamId];
                                    if (roles.length === 0) return null;
                                    const team = getTeam(teamId);

                                    return (
                                        <div key={teamId} className="mb-6">
                                            {/* Team Header */}
                                            <div className="flex items-center gap-2 mb-3 ml-1">
                                                <Icon
                                                    name={team.icon}
                                                    size="sm"
                                                    className={team.colors.text}
                                                />
                                                <span
                                                    className={cn(
                                                        "text-xs font-tarot tracking-wider uppercase",
                                                        team.colors.text
                                                    )}
                                                >
                                                    {getTeamName(teamId)}
                                                </span>
                                                {teamCounts[teamId] > 0 && (
                                                    <Badge
                                                        variant={teamId}
                                                        className="text-[10px] px-1.5 py-0 ml-auto"
                                                    >
                                                        {teamCounts[teamId]}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Card Grid */}
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {roles.map((role) => {
                                                    const count =
                                                        roleCounts[role.id] ??
                                                        0;
                                                    const isSelected =
                                                        count > 0;
                                                    const desc =
                                                        getRoleDescription(
                                                            role
                                                        );

                                                    return (
                                                        <button
                                                            key={role.id}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleRole(
                                                                    role.id
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-xl border-2 transition-all relative flex flex-col",
                                                                isSelected
                                                                    ? cn(
                                                                          team
                                                                              .colors
                                                                              .cardBorder,
                                                                          "bg-gradient-to-b from-white/10 to-white/5"
                                                                      )
                                                                    : "border-white/10 bg-white/5 hover:bg-white/[0.08]"
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
                                                                            team
                                                                                .colors
                                                                                .badge
                                                                        )}
                                                                    >
                                                                        <Icon
                                                                            name="check"
                                                                            size="xs"
                                                                            className={
                                                                                team
                                                                                    .colors
                                                                                    .badgeText
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
                                                                        : "bg-white/5 border border-white/10"
                                                                )}
                                                            >
                                                                <Icon
                                                                    name={role.icon}
                                                                    size="md"
                                                                    className={
                                                                        isSelected
                                                                            ? team
                                                                                  .colors
                                                                                  .text
                                                                            : "text-parchment-500"
                                                                    }
                                                                />
                                                            </div>
                                                            <div
                                                                className={cn(
                                                                    "text-[11px] font-tarot tracking-wider uppercase mt-2",
                                                                    isSelected
                                                                        ? "text-parchment-100"
                                                                        : "text-parchment-300"
                                                                )}
                                                            >
                                                                {getRoleName(
                                                                    role
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-parchment-500 line-clamp-2 mt-1 leading-snug text-left">
                                                                {desc}
                                                            </p>
                                                            </div>

                                                            {/* +/- Controls (only when selected) */}
                                                            {isSelected && (
                                                                <div
                                                                    className="flex items-center justify-center gap-2 pt-2 pb-2.5 border-t border-white/10"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            decrementRole(
                                                                                role.id
                                                                            )
                                                                        }
                                                                        className="w-6 h-6 flex items-center justify-center text-parchment-400 hover:text-parchment-100 hover:bg-white/10 rounded transition-colors"
                                                                    >
                                                                        <Icon
                                                                            name="minus"
                                                                            size="xs"
                                                                        />
                                                                    </button>
                                                                    <span
                                                                        className={cn(
                                                                            "text-sm font-medium min-w-[1.5rem] text-center",
                                                                            team
                                                                                .colors
                                                                                .text
                                                                        )}
                                                                    >
                                                                        {count}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            incrementRole(
                                                                                role.id
                                                                            )
                                                                        }
                                                                        className="w-6 h-6 flex items-center justify-center text-parchment-400 hover:text-parchment-100 hover:bg-white/10 rounded transition-colors"
                                                                    >
                                                                        <Icon
                                                                            name="plus"
                                                                            size="xs"
                                                                        />
                                                                    </button>
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
                })}
            </div>

            {/* Footer with counter on button */}
            <ScreenFooter>
                <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    fullWidth
                    size="lg"
                    variant="gold"
                >
                    {t.newGame.nextAssignRoles}
                    <span className="ml-2 opacity-70 font-sans text-sm normal-case">
                        ({totalRoles}/{players.length})
                    </span>
                    <Icon name="arrowRight" size="md" className="ml-1" />
                </Button>
            </ScreenFooter>
        </div>
    );
}
