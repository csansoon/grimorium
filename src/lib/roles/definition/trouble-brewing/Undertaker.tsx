import { useState, useMemo } from "react";
import { RoleDefinition } from "../../types";
import { getRole } from "../../index";
import { getTeam } from "../../../teams";
import { isAlive } from "../../../types";
import { useI18n } from "../../../i18n";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";
import { RoleCard } from "../../../../components/items/RoleCard";
import { PerceptionConfigStep } from "../../../../components/items";
import {
    TeamBackground,
    CardLink,
} from "../../../../components/items/TeamBackground";
import { NightStepListLayout } from "../../../../components/layouts";
import type { NightStep } from "../../../../components/layouts";
import { perceive, getAmbiguousPlayers, applyPerceptionOverrides } from "../../../pipeline";
import { Perception } from "../../../pipeline/types";
import { cn } from "../../../../lib/utils";

// Helper to find execution from the previous day
function findExecutedPlayerId(game: {
    history: Array<{ type: string; data: Record<string, unknown> }>;
}): string | null {
    let lastDayStartIndex = -1;

    for (let i = game.history.length - 1; i >= 0; i--) {
        const entry = game.history[i];
        if (entry.type === "day_started") {
            lastDayStartIndex = i;
            break;
        }
    }

    if (lastDayStartIndex !== -1) {
        for (let i = lastDayStartIndex; i < game.history.length; i++) {
            const entry = game.history[i];
            if (entry.type === "execution") {
                return entry.data.playerId as string;
            }
        }
    }

    return null;
}

type Phase = "step_list" | "configure_perceptions" | "show_role";

const definition: RoleDefinition = {
    id: "undertaker",
    team: "townsfolk",
    icon: "shovel",
    nightOrder: 40, // Wakes late, after deaths are resolved

    // Only wake if alive, not first night, AND there was an execution during the day
    shouldWake: (game, player) => {
        if (!isAlive(player)) return false;
        const round = game.history.at(-1)?.stateAfter.round ?? 0;
        if (round <= 1) return false; // Skip first night
        return findExecutedPlayerId(game) !== null;
    },

    nightSteps: [
        {
            id: "configure_perceptions",
            icon: "eye",
            getLabel: (t) => t.game.stepConfigurePerceptions,
            condition: (game, _player, state) => {
                const executedPlayerId = findExecutedPlayerId(game);
                if (!executedPlayerId) return false;
                const executedPlayer = state.players.find(
                    (p) => p.id === executedPlayerId,
                );
                if (!executedPlayer) return false;
                return getAmbiguousPlayers([executedPlayer], "role").length > 0;
            },
        },
        {
            id: "show_role",
            icon: "shovel",
            getLabel: (t) => t.game.stepShowRole,
        },
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ game, state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("step_list");
        const [perceptionOverrides, setPerceptionOverrides] = useState<
            Record<string, Partial<Perception>>
        >({});

        // Find the executed player
        const executedPlayerId = findExecutedPlayerId(game);
        const executedPlayer = executedPlayerId
            ? state.players.find((p) => p.id === executedPlayerId)
            : null;

        // Check if perception config is needed for the executed player
        const ambiguousPlayers = useMemo(
            () =>
                executedPlayer
                    ? getAmbiguousPlayers([executedPlayer], "role")
                    : [],
            [executedPlayer],
        );
        const needsPerceptionConfig = ambiguousPlayers.length > 0;

        const [perceptionConfigDone, setPerceptionConfigDone] = useState(false);

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        // Build steps
        const steps: NightStep[] = useMemo(() => {
            const result: NightStep[] = [];

            if (needsPerceptionConfig) {
                result.push({
                    id: "configure_perceptions",
                    icon: "eye",
                    label: t.game.stepConfigurePerceptions,
                    status: perceptionConfigDone ? "done" : "pending",
                });
            }

            result.push({
                id: "show_role",
                icon: "shovel",
                label: t.game.stepShowRole,
                status: "pending",
            });

            return result;
        }, [needsPerceptionConfig, perceptionConfigDone, t]);

        const handleSelectStep = (stepId: string) => {
            if (stepId === "configure_perceptions") {
                setPhase("configure_perceptions");
            } else if (stepId === "show_role") {
                setPhase("show_role");
            }
        };

        const handlePerceptionComplete = (
            overrides: Record<string, Partial<Perception>>,
        ) => {
            setPerceptionOverrides(overrides);
            setPerceptionConfigDone(true);
            setPhase("step_list");
        };

        // Apply perception overrides
        const effectiveState = useMemo(
            () => applyPerceptionOverrides(state, perceptionOverrides),
            [state, perceptionOverrides],
        );

        // Get perceived role of executed player
        const executedPerception = useMemo(() => {
            if (!executedPlayer) return null;
            const effectiveExecuted =
                effectiveState.players.find((p) => p.id === executedPlayer.id) ??
                executedPlayer;
            const effectiveObserver =
                effectiveState.players.find((p) => p.id === player.id) ?? player;
            return perceive(
                effectiveExecuted,
                effectiveObserver,
                "role",
                effectiveState,
            );
        }, [effectiveState, executedPlayer, player]);

        const executedRole = executedPerception
            ? getRole(executedPerception.roleId)
            : null;

        const handleComplete = () => {
            if (executedPlayer && executedRole) {
                onComplete({
                    entries: [
                        {
                            type: "night_action",
                            message: [
                                {
                                    type: "i18n",
                                    key: "roles.undertaker.history.sawExecutedRole",
                                    params: {
                                        player: player.id,
                                        role: executedRole.id,
                                    },
                                },
                            ],
                            data: {
                                roleId: "undertaker",
                                playerId: player.id,
                                action: "saw_executed",
                                executedPlayerId: executedPlayer.id,
                                executedRoleId: executedRole.id,
                                perceptionOverrides:
                                    Object.keys(perceptionOverrides).length > 0
                                        ? perceptionOverrides
                                        : undefined,
                            },
                        },
                    ],
                });
            }
        };

        // Phase: Step List
        if (phase === "step_list") {
            return (
                <NightStepListLayout
                    icon="shovel"
                    roleName={getRoleName("undertaker")}
                    playerName={player.name}
                    steps={steps}
                    onSelectStep={handleSelectStep}
                />
            );
        }

        // Phase: Configure Perceptions
        if (phase === "configure_perceptions") {
            return (
                <PerceptionConfigStep
                    ambiguousPlayers={ambiguousPlayers}
                    context="role"
                    state={state}
                    roleIcon="shovel"
                    roleName={getRoleName("undertaker")}
                    playerName={player.name}
                    onComplete={handlePerceptionComplete}
                />
            );
        }

        // Phase: Show Role
        if (!executedPerception) return null;

        const shownRole = getRole(executedPerception.roleId);
        const shownTeamId = shownRole?.team ?? "townsfolk";
        const shownTeam = getTeam(shownTeamId);

        return (
            <TeamBackground teamId={shownTeamId}>
                <p
                    className={cn(
                        "text-center text-xs uppercase tracking-widest font-semibold mb-4",
                        shownTeam.isEvil
                            ? "text-red-300/80"
                            : "text-parchment-300/80",
                    )}
                >
                    {t.game.executedPlayerRole}
                </p>

                <RoleCard roleId={executedPerception.roleId} />

                <CardLink onClick={handleComplete} isEvil={shownTeam.isEvil}>
                    {t.common.continue}
                </CardLink>
            </TeamBackground>
        );
    },
};

export default definition;
