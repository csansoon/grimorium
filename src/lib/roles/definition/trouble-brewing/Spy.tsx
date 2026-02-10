import { useState, useMemo } from "react";
import { RoleDefinition } from "../../types";
import { useI18n } from "../../../i18n";
import { getRole } from "../../index";
import { getTeam } from "../../../teams";
import { isMalfunctioning } from "../../../effects";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";
import {
    NightActionLayout,
    NightStepListLayout,
} from "../../../../components/layouts";
import type { NightStep } from "../../../../components/layouts";
import { Button, Icon, Badge } from "../../../../components/atoms";
import { MysticDivider } from "../../../../components/items";
import { isAlive, hasEffect } from "../../../types";
import { cn } from "../../../../lib/utils";

type Phase = "step_list" | "view_grimoire";

/**
 * The Spy — Minion role.
 *
 * Each night, you may look at the Grimoire. You might register as good
 * & as a Townsfolk or Outsider, even if you are dead.
 *
 * Night action: The Spy views the Grimoire — a read-only view showing
 * all players, their true roles, and their active effects. This is a
 * player-facing screen (the narrator hands the device to the Spy).
 *
 * Misregistration is handled by the `spy_misregister` effect applied
 * at game start. Information roles automatically detect the Spy via
 * `getAmbiguousPlayers()` and offer narrator perception configuration.
 *
 * When malfunctioning (Poisoned/Drunk), the Spy does NOT see the
 * Grimoire. The narrator handles deception manually.
 */
const definition: RoleDefinition = {
    id: "spy",
    team: "minion",
    icon: "eye",
    nightOrder: 36, // Late — sees up-to-date state after most actions

    shouldWake: (_game, player) => isAlive(player),

    initialEffects: [{ type: "spy_misregister", expiresAt: "never" }],

    nightSteps: [
        {
            id: "view_grimoire",
            icon: "scrollText",
            getLabel: (t) => t.game.stepViewGrimoire,
        },
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("step_list");

        const malfunctioning = isMalfunctioning(player);

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        const handleComplete = () => {
            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.spy.history.viewedGrimoire",
                                params: { player: player.id },
                            },
                        ],
                        data: {
                            roleId: "spy",
                            playerId: player.id,
                            action: "view_grimoire",
                            ...(malfunctioning
                                ? { malfunctioned: true }
                                : {}),
                        },
                    },
                ],
            });
        };

        // ================================================================
        // RENDER: Step List
        // ================================================================

        if (phase === "step_list") {
            const steps: NightStep[] = [
                {
                    id: "view_grimoire",
                    icon: "scrollText",
                    label: t.game.stepViewGrimoire,
                    status: "pending",
                },
            ];

            return (
                <NightStepListLayout
                    icon="eye"
                    roleName={getRoleName("spy")}
                    playerName={player.name}
                    isEvil
                    steps={steps}
                    onSelectStep={() => setPhase("view_grimoire")}
                />
            );
        }

        // ================================================================
        // RENDER: Malfunctioning — don't show real Grimoire
        // ================================================================

        if (malfunctioning) {
            return (
                <NightActionLayout
                    player={player}
                    title={t.game.spyMalfunctionTitle}
                    description={t.game.spyMalfunctionDescription}
                >
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/30 border border-amber-600/30">
                            <Icon
                                name="alertTriangle"
                                size="md"
                                className="text-amber-400"
                            />
                            <span className="text-amber-200 text-sm font-medium">
                                {t.game.malfunctionWarning}
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleComplete}
                        fullWidth
                        size="lg"
                        variant="evil"
                    >
                        <Icon name="check" size="md" className="mr-2" />
                        {t.common.continue}
                    </Button>
                </NightActionLayout>
            );
        }

        // ================================================================
        // RENDER: View Grimoire (player-facing)
        // ================================================================

        return (
            <NightActionLayout
                player={player}
                title={t.game.spyGrimoireTitle}
                description={t.game.spyGrimoireDescription}
            >
                <div className="space-y-1 mb-6">
                    {state.players.map((p) => (
                        <SpyGrimoireRow
                            key={p.id}
                            player={p}
                            getRoleName={getRoleName}
                            t={t}
                        />
                    ))}
                </div>

                <MysticDivider />

                <Button
                    onClick={handleComplete}
                    fullWidth
                    size="lg"
                    variant="evil"
                    className="mt-4"
                >
                    <Icon name="check" size="md" className="mr-2" />
                    {t.common.iUnderstandMyRole}
                </Button>
            </NightActionLayout>
        );
    },
};

// ============================================================================
// Spy Grimoire Row — shows each player's true role and effects
// ============================================================================

function SpyGrimoireRow({
    player,
    getRoleName,
    t,
}: {
    player: import("../../../types").PlayerState;
    getRoleName: (roleId: string) => string;
    t: ReturnType<typeof useI18n>["t"];
}) {
    const role = getRole(player.roleId);
    const team = role ? getTeam(role.team) : null;
    const isDead = hasEffect(player, "dead");
    const isEvil = team?.isEvil ?? false;

    // Collect meaningful effects (skip dead — shown visually)
    const visibleEffects = useMemo(() => {
        return player.effects
            .filter((e) => e.type !== "dead" && e.type !== "used_dead_vote")
            .map((e) => {
                const key = e.type as keyof typeof t.effects;
                return {
                    type: e.type,
                    name: t.effects[key]?.name ?? e.type,
                };
            });
    }, [player.effects, t.effects]);

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                isDead
                    ? "bg-parchment-500/5 opacity-60"
                    : isEvil
                      ? "bg-red-900/20 border border-red-700/30"
                      : "bg-indigo-900/20 border border-indigo-700/30"
            )}
        >
            {/* Role Icon */}
            <div
                className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border",
                    isDead
                        ? "bg-parchment-500/10 border-parchment-500/20"
                        : isEvil
                          ? "bg-red-900/30 border-red-600/30"
                          : "bg-indigo-500/10 border-indigo-400/30"
                )}
            >
                {isDead ? (
                    <Icon
                        name="skull"
                        size="md"
                        className="text-parchment-500"
                    />
                ) : role ? (
                    <Icon
                        name={role.icon}
                        size="md"
                        className={team?.colors.text}
                    />
                ) : (
                    <Icon
                        name="user"
                        size="md"
                        className="text-parchment-400"
                    />
                )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "font-medium text-sm",
                            isDead
                                ? "text-parchment-500 line-through"
                                : "text-parchment-100"
                        )}
                    >
                        {player.name}
                    </span>
                    {visibleEffects.map((effect) => (
                        <Badge
                            key={effect.type}
                            variant="effect"
                            className="px-1.5 py-0.5 text-[10px]"
                        >
                            {effect.name}
                        </Badge>
                    ))}
                </div>
                {role && (
                    <span
                        className={cn(
                            "text-xs",
                            isDead
                                ? "text-parchment-600"
                                : isEvil
                                  ? "text-red-400/70"
                                  : "text-indigo-400/70"
                        )}
                    >
                        {getRoleName(player.roleId)}
                        {team && (
                            <span className="text-parchment-600 ml-1">
                                ({t.teams[role.team]?.name ?? role.team})
                            </span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

export default definition;
