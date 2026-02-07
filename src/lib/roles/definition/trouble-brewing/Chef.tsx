import { useState } from "react";
import { RoleDefinition } from "../../types";
import { getRole } from "../../index";
import { useI18n, interpolate } from "../../../i18n";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout, NarratorSetupLayout } from "../../../../components/layouts";
import { RoleRevealBadge, StepSection } from "../../../../components/items";
import { Button, Icon } from "../../../../components/atoms";
import { GameState, isAlive } from "../../../types";

type Phase = "narrator_setup" | "player_view";

/**
 * Calculate the number of pairs of evil players sitting next to each other.
 * Accepts an optional set of player IDs that register as evil (for Recluse overrides).
 */
function countEvilPairs(
    state: GameState,
    recluseOverrides?: Record<string, boolean>
): number {
    const alivePlayers = state.players.filter(isAlive);
    if (alivePlayers.length < 2) return 0;

    // Get indices of alive players in the original order
    const aliveIndices = state.players
        .map((p, i) => (isAlive(p) ? i : -1))
        .filter((i) => i !== -1);

    const isEvil = (playerIdx: number): boolean => {
        const player = state.players[playerIdx];
        // Check Recluse override
        if (player.roleId === "recluse" && recluseOverrides) {
            return recluseOverrides[player.id] ?? false;
        }
        const role = getRole(player.roleId);
        return role?.team === "minion" || role?.team === "demon";
    };

    let evilPairs = 0;

    // Check each pair of adjacent alive players (in circular order)
    for (let i = 0; i < aliveIndices.length; i++) {
        const currentIdx = aliveIndices[i];
        const nextIdx = aliveIndices[(i + 1) % aliveIndices.length];

        if (isEvil(currentIdx) && isEvil(nextIdx)) {
            evilPairs++;
        }
    }

    return evilPairs;
}

const definition: RoleDefinition = {
    id: "chef",
    team: "townsfolk",
    icon: "chefHat",
    nightOrder: 13,
    shouldWake: (game, player) =>
        isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();

        // Check if any alive player is a Recluse
        const reclusePlayers = state.players.filter(
            (p) => isAlive(p) && p.roleId === "recluse"
        );
        const hasRecluse = reclusePlayers.length > 0;

        const [phase, setPhase] = useState<Phase>(
            hasRecluse ? "narrator_setup" : "player_view"
        );
        const [recluseRegistersAsEvil, setRecluseRegistersAsEvil] = useState<
            Record<string, boolean>
        >({});

        // Calculate evil pairs with Recluse overrides
        const evilPairs = countEvilPairs(
            state,
            hasRecluse ? recluseRegistersAsEvil : undefined
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
            return (
                <NarratorSetupLayout
                    icon="chefHat"
                    roleName={getRoleName("chef")}
                    playerName={getPlayerName(player.id)}
                    onShowToPlayer={() => setPhase("player_view")}
                >
                    <StepSection step={1} label={t.game.reclusePrompt}>
                        {reclusePlayers.map((recluse) => {
                            const isEvil =
                                recluseRegistersAsEvil[recluse.id] ?? false;

                            return (
                                <div key={recluse.id} className="mb-4">
                                    <p className="text-sm text-parchment-300 mb-3">
                                        {interpolate(
                                            t.game.doesRecluseRegisterAsEvil,
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
