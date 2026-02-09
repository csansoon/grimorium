import { useState, useMemo } from "react";
import { RoleDefinition } from "../../types";
import { useI18n } from "../../../i18n";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";
import { NightActionLayout } from "../../../../components/layouts";
import { NightStepListLayout } from "../../../../components/layouts";
import type { NightStep } from "../../../../components/layouts";
import { RoleRevealBadge, PerceptionConfigStep } from "../../../../components/items";
import { Button, Icon } from "../../../../components/atoms";
import { GameState, PlayerState, isAlive } from "../../../types";
import { perceive, getAmbiguousPlayers, applyPerceptionOverrides } from "../../../pipeline";
import { Perception } from "../../../pipeline/types";

/**
 * Calculate the number of pairs of evil players sitting next to each other.
 * Dead players are skipped when determining neighbors.
 * Uses the perception system so roles like Recluse/Spy are properly handled.
 */
export function countEvilPairs(state: GameState, observer: PlayerState): number {
    const alivePlayers = state.players.filter(isAlive);
    if (alivePlayers.length < 2) return 0;

    // Get indices of alive players in the original order
    const aliveIndices = state.players
        .map((p, i) => (isAlive(p) ? i : -1))
        .filter((i) => i !== -1);

    let evilPairs = 0;

    // Check each pair of adjacent alive players (in circular order)
    for (let i = 0; i < aliveIndices.length; i++) {
        const currentIdx = aliveIndices[i];
        const nextIdx = aliveIndices[(i + 1) % aliveIndices.length];

        const currentPlayer = state.players[currentIdx];
        const nextPlayer = state.players[nextIdx];

        const currentIsEvil =
            perceive(currentPlayer, observer, "alignment", state).alignment === "evil";
        const nextIsEvil =
            perceive(nextPlayer, observer, "alignment", state).alignment === "evil";

        if (currentIsEvil && nextIsEvil) {
            evilPairs++;
        }
    }

    return evilPairs;
}

type Phase = "step_list" | "configure_perceptions" | "show_result";

const definition: RoleDefinition = {
    id: "chef",
    team: "townsfolk",
    icon: "chefHat",
    nightOrder: 13,
    shouldWake: (game, player) => isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

    nightSteps: [
        {
            id: "configure_perceptions",
            icon: "eye",
            getLabel: (t) => t.game.stepConfigurePerceptions,
            condition: (_game, _player, state) =>
                getAmbiguousPlayers(state.players.filter(isAlive), "alignment").length > 0,
        },
        {
            id: "show_result",
            icon: "chefHat",
            getLabel: (t) => t.game.stepShowResult,
        },
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("step_list");
        const [perceptionOverrides, setPerceptionOverrides] = useState<
            Record<string, Partial<Perception>>
        >({});

        // Check if perception config is needed
        const ambiguousPlayers = useMemo(
            () => getAmbiguousPlayers(state.players.filter(isAlive), "alignment"),
            [state],
        );
        const needsPerceptionConfig = ambiguousPlayers.length > 0;

        // Track which steps are done
        const [perceptionConfigDone, setPerceptionConfigDone] = useState(false);

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        // Build steps for the step list
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
                id: "show_result",
                icon: "chefHat",
                label: t.game.stepShowResult,
                status: "pending",
            });

            return result;
        }, [needsPerceptionConfig, perceptionConfigDone, t]);

        const handleSelectStep = (stepId: string) => {
            if (stepId === "configure_perceptions") {
                setPhase("configure_perceptions");
            } else if (stepId === "show_result") {
                setPhase("show_result");
            }
        };

        const handlePerceptionComplete = (
            overrides: Record<string, Partial<Perception>>,
        ) => {
            setPerceptionOverrides(overrides);
            setPerceptionConfigDone(true);
            setPhase("step_list");
        };

        // Apply perception overrides and calculate evil pairs
        const effectiveState = useMemo(
            () => applyPerceptionOverrides(state, perceptionOverrides),
            [state, perceptionOverrides],
        );

        const evilPairs = useMemo(
            () => {
                // Find the observer player in the effective state
                const effectiveObserver = effectiveState.players.find(
                    (p) => p.id === player.id,
                ) ?? player;
                return countEvilPairs(effectiveState, effectiveObserver);
            },
            [effectiveState, player],
        );

        const handleComplete = () => {
            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.chef.history.sawEvilPairs",
                                params: {
                                    player: player.id,
                                    count: evilPairs.toString(),
                                },
                            },
                        ],
                        data: {
                            roleId: "chef",
                            playerId: player.id,
                            action: "count_evil_pairs",
                            evilPairs,
                            perceptionOverrides:
                                Object.keys(perceptionOverrides).length > 0
                                    ? perceptionOverrides
                                    : undefined,
                        },
                    },
                ],
            });
        };

        // Phase: Step List
        if (phase === "step_list") {
            return (
                <NightStepListLayout
                    icon="chefHat"
                    roleName={getRoleName("chef")}
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
                    context="alignment"
                    state={state}
                    roleIcon="chefHat"
                    roleName={getRoleName("chef")}
                    playerName={player.name}
                    onComplete={handlePerceptionComplete}
                />
            );
        }

        // Phase: Show Result
        return (
            <NightActionLayout
                player={player}
                title={t.game.chefInfo}
                description={t.game.evilPairsExplanation}
            >
                <div className="text-center mb-6">
                    <p className="text-parchment-400 text-sm mb-4">
                        {t.game.evilPairsCount}
                    </p>
                    <RoleRevealBadge
                        icon="chefHat"
                        roleName={evilPairs.toString()}
                    />
                </div>

                <Button
                    onClick={handleComplete}
                    fullWidth
                    size="lg"
                    variant="night"
                >
                    <Icon name="check" size="md" className="mr-2" />
                    {t.common.iUnderstandMyRole}
                </Button>
            </NightActionLayout>
        );
    },
};

export default definition;
