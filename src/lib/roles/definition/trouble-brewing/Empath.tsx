import { useState, useMemo } from "react";
import { RoleDefinition } from "../../types";
import { useI18n } from "../../../i18n";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";
import { NightActionLayout, NightStepListLayout } from "../../../../components/layouts";
import type { NightStep } from "../../../../components/layouts";
import { RoleRevealBadge, PerceptionConfigStep } from "../../../../components/items";
import { Button, Icon } from "../../../../components/atoms";
import { getAliveNeighbors, isAlive } from "../../../types";
import { perceive, getAmbiguousPlayers, applyPerceptionOverrides } from "../../../pipeline";
import { Perception } from "../../../pipeline/types";

type Phase = "step_list" | "configure_perceptions" | "show_result";

const definition: RoleDefinition = {
    id: "empath",
    team: "townsfolk",
    icon: "handHeart",
    nightOrder: 14,
    shouldWake: (_game, player) => isAlive(player),

    nightSteps: [
        {
            id: "configure_perceptions",
            icon: "eye",
            getLabel: (t) => t.game.stepConfigurePerceptions,
            condition: (_game, player, state) => {
                const [left, right] = getAliveNeighbors(state, player.id);
                const neighbors = [left, right].filter(
                    (n): n is NonNullable<typeof n> => n != null && n.id !== left?.id || n === left,
                );
                return getAmbiguousPlayers(neighbors, "alignment").length > 0;
            },
        },
        {
            id: "show_result",
            icon: "handHeart",
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

        // Get alive neighbors
        const [leftNeighbor, rightNeighbor] = getAliveNeighbors(state, player.id);

        // Collect unique neighbors for ambiguity check
        const neighbors = useMemo(() => {
            const result = [];
            if (leftNeighbor) result.push(leftNeighbor);
            if (rightNeighbor && rightNeighbor.id !== leftNeighbor?.id)
                result.push(rightNeighbor);
            return result;
        }, [leftNeighbor, rightNeighbor]);

        const ambiguousPlayers = useMemo(
            () => getAmbiguousPlayers(neighbors, "alignment"),
            [neighbors],
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
                id: "show_result",
                icon: "handHeart",
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

        // Apply overrides and calculate
        const effectiveState = useMemo(
            () => applyPerceptionOverrides(state, perceptionOverrides),
            [state, perceptionOverrides],
        );

        const evilNeighbors = useMemo(() => {
            const effectiveObserver =
                effectiveState.players.find((p) => p.id === player.id) ?? player;
            const [effLeft, effRight] = getAliveNeighbors(
                effectiveState,
                player.id,
            );

            let count = 0;
            if (effLeft) {
                const perception = perceive(
                    effLeft,
                    effectiveObserver,
                    "alignment",
                    effectiveState,
                );
                if (perception.alignment === "evil") count++;
            }
            if (effRight && effRight.id !== effLeft?.id) {
                const perception = perceive(
                    effRight,
                    effectiveObserver,
                    "alignment",
                    effectiveState,
                );
                if (perception.alignment === "evil") count++;
            }
            return count;
        }, [effectiveState, player]);

        const handleComplete = () => {
            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.empath.history.sawEvilNeighbors",
                                params: {
                                    player: player.id,
                                    count: evilNeighbors.toString(),
                                },
                            },
                        ],
                        data: {
                            roleId: "empath",
                            playerId: player.id,
                            action: "count_evil_neighbors",
                            evilNeighbors,
                            leftNeighborId: leftNeighbor?.id,
                            rightNeighborId: rightNeighbor?.id,
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
                    icon="handHeart"
                    roleName={getRoleName("empath")}
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
                    roleIcon="handHeart"
                    roleName={getRoleName("empath")}
                    playerName={player.name}
                    onComplete={handlePerceptionComplete}
                />
            );
        }

        // Phase: Show Result
        return (
            <NightActionLayout
                player={player}
                title={t.game.empathInfo}
                description={t.game.evilNeighborsExplanation}
            >
                <div className="text-center mb-6">
                    <p className="text-parchment-400 text-sm mb-4">
                        {t.game.evilNeighborsCount}
                    </p>
                    <RoleRevealBadge
                        icon="handHeart"
                        roleName={evilNeighbors.toString()}
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
