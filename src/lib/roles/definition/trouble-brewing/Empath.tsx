import { useState } from "react";
import { RoleDefinition } from "../../types";
import { getRole } from "../../index";
import { useI18n, interpolate } from "../../../i18n";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout, NarratorSetupLayout } from "../../../../components/layouts";
import { RoleRevealBadge, StepSection } from "../../../../components/items";
import { Button, Icon } from "../../../../components/atoms";
import { getAliveNeighbors, isAlive } from "../../../types";

type Phase = "narrator_setup" | "player_view";

const definition: RoleDefinition = {
    id: "empath",
    team: "townsfolk",
    icon: "handHeart",
    nightOrder: 14,
    shouldWake: (_game, player) => isAlive(player),

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();

        // Get alive neighbors
        const [leftNeighbor, rightNeighbor] = getAliveNeighbors(state, player.id);

        // Check if any neighbor is a Recluse
        const leftIsRecluse = leftNeighbor?.roleId === "recluse";
        const rightIsRecluse =
            rightNeighbor?.roleId === "recluse" &&
            rightNeighbor?.id !== leftNeighbor?.id;
        const hasRecluseNeighbor = leftIsRecluse || rightIsRecluse;

        const [phase, setPhase] = useState<Phase>(
            hasRecluseNeighbor ? "narrator_setup" : "player_view"
        );
        const [recluseRegistersAsEvil, setRecluseRegistersAsEvil] = useState<
            Record<string, boolean>
        >({});

        // Calculate evil neighbors with Recluse overrides
        const calculateEvilNeighbors = () => {
            let evilNeighbors = 0;

            if (leftNeighbor) {
                if (leftIsRecluse) {
                    if (recluseRegistersAsEvil[leftNeighbor.id])
                        evilNeighbors++;
                } else {
                    const leftRole = getRole(leftNeighbor.roleId);
                    if (
                        leftRole?.team === "minion" ||
                        leftRole?.team === "demon"
                    ) {
                        evilNeighbors++;
                    }
                }
            }

            if (rightNeighbor && rightNeighbor.id !== leftNeighbor?.id) {
                if (rightIsRecluse) {
                    if (recluseRegistersAsEvil[rightNeighbor.id])
                        evilNeighbors++;
                } else {
                    const rightRole = getRole(rightNeighbor.roleId);
                    if (
                        rightRole?.team === "minion" ||
                        rightRole?.team === "demon"
                    ) {
                        evilNeighbors++;
                    }
                }
            }

            return evilNeighbors;
        };

        const evilNeighbors = calculateEvilNeighbors();

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
                            recluseOverrides:
                                Object.keys(recluseRegistersAsEvil).length > 0
                                    ? recluseRegistersAsEvil
                                    : undefined,
                        },
                    },
                ],
            });
        };

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        const getPlayerName = (playerId: string) => {
            return (
                state.players.find((p) => p.id === playerId)?.name ?? "Unknown"
            );
        };

        // Narrator Setup Phase - Recluse registration
        if (phase === "narrator_setup") {
            const recluseNeighbors = [
                leftIsRecluse ? leftNeighbor : null,
                rightIsRecluse ? rightNeighbor : null,
            ].filter(Boolean);

            return (
                <NarratorSetupLayout
                    icon="handHeart"
                    roleName={getRoleName("empath")}
                    playerName={getPlayerName(player.id)}
                    onShowToPlayer={() => setPhase("player_view")}
                >
                    <StepSection step={1} label={t.game.reclusePrompt}>
                        {recluseNeighbors.map((recluse) => {
                            if (!recluse) return null;
                            const isEvil =
                                recluseRegistersAsEvil[recluse.id] ?? false;

                            return (
                                <div key={recluse.id} className="mb-4">
                                    <p className="text-sm text-parchment-300 mb-3">
                                        {interpolate(
                                            t.game
                                                .doesRecluseRegisterAsEvil,
                                            { player: recluse.name }
                                        )}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setRecluseRegistersAsEvil(
                                                    (prev) => ({
                                                        ...prev,
                                                        [recluse.id]: false,
                                                    })
                                                )
                                            }
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                                                !isEvil
                                                    ? "bg-emerald-700/40 border-emerald-500 text-emerald-200"
                                                    : "bg-white/5 border-white/10 text-parchment-400 hover:border-white/30"
                                            }`}
                                        >
                                            <Icon
                                                name="checkCircle"
                                                size="sm"
                                                className="inline mr-2"
                                            />
                                            {t.game.recluseRegistersAsGood}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setRecluseRegistersAsEvil(
                                                    (prev) => ({
                                                        ...prev,
                                                        [recluse.id]: true,
                                                    })
                                                )
                                            }
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                                                isEvil
                                                    ? "bg-red-700/40 border-red-500 text-red-200"
                                                    : "bg-white/5 border-white/10 text-parchment-400 hover:border-white/30"
                                            }`}
                                        >
                                            <Icon
                                                name="alertTriangle"
                                                size="sm"
                                                className="inline mr-2"
                                            />
                                            {t.game.recluseRegistersAsEvil}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </StepSection>
                </NarratorSetupLayout>
            );
        }

        // Player View Phase
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 font-tarot uppercase tracking-wider"
                >
                    <Icon name="check" size="md" className="mr-2" />
                    {t.common.iUnderstandMyRole}
                </Button>
            </NightActionLayout>
        );
    },
};

export default definition;
