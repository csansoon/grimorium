import { useState } from "react";
import { RoleDefinition } from "../types";
import { isAlive } from "../../types";
import { isMalfunctioning } from "../../effects";
import { useI18n } from "../../i18n";
import { DefaultRoleReveal } from "../../../components/items/DefaultRoleReveal";
import { NightActionLayout, NightStepListLayout } from "../../../components/layouts";
import type { NightStep } from "../../../components/layouts";
import { PlayerSelector } from "../../../components/inputs";
import { Button, Icon } from "../../../components/atoms";

/**
 * The Imp — Demon role.
 *
 * Simplified: the Imp just selects a target and emits a kill intent.
 * All effect interactions (Safe protection, Bounce redirect) are handled
 * by the pipeline through effect handlers. The Imp has zero knowledge
 * of other roles.
 */
const definition: RoleDefinition = {
    id: "imp",
    team: "demon",
    icon: "skull",
    nightOrder: 30,
    shouldWake: (game, player) =>
        isAlive(player) &&
        (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

    nightSteps: [
        {
            id: "choose_victim",
            icon: "skull",
            getLabel: (t) => t.game.stepChooseVictim,
        },
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<"step_list" | "choose_victim">("step_list");
        const [selectedTarget, setSelectedTarget] = useState<string | null>(
            null
        );

        const alivePlayers = state.players.filter((p) => isAlive(p));

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        const malfunctioning = isMalfunctioning(player);

        const handleConfirm = () => {
            if (!selectedTarget) return;

            const target = state.players.find(
                (p) => p.id === selectedTarget
            );
            if (!target) return;

            onComplete({
                // Log the Imp's choice (always recorded regardless of outcome)
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.imp.history.choseToKill",
                                params: {
                                    player: player.id,
                                    target: target.id,
                                },
                            },
                        ],
                        data: {
                            roleId: "imp",
                            playerId: player.id,
                            action: "kill",
                            targetId: target.id,
                            ...(malfunctioning ? { malfunctioned: true } : {}),
                        },
                    },
                ],
                // When malfunctioning, the kill intent is NOT emitted
                ...(!malfunctioning && {
                    intent: {
                        type: "kill" as const,
                        sourceId: player.id,
                        targetId: target.id,
                        cause: "demon",
                    },
                }),
            });
        };

        // Step List Phase
        if (phase === "step_list") {
            const steps: NightStep[] = [
                {
                    id: "choose_victim",
                    icon: "skull",
                    label: t.game.stepChooseVictim,
                    status: "pending",
                },
            ];

            return (
                <NightStepListLayout
                    icon="skull"
                    roleName={getRoleName("imp")}
                    playerName={player.name}
                    isEvil
                    steps={steps}
                    onSelectStep={() => setPhase("choose_victim")}
                />
            );
        }

        return (
            <NightActionLayout
                player={player}
                title={t.game.choosePlayerToKill}
                description={t.game.selectVictim}
            >
                <div className="mb-6">
                    <PlayerSelector
                        players={alivePlayers}
                        selected={selectedTarget}
                        onSelect={setSelectedTarget}
                        selectedIcon="skull"
                        variant="red"
                    />
                </div>

                <Button
                    onClick={handleConfirm}
                    disabled={!selectedTarget}
                    fullWidth
                    size="lg"
                    variant="evil"
                >
                    <Icon name="skull" size="md" className="mr-2" />
                    {t.game.confirmKill}
                </Button>
            </NightActionLayout>
        );
    },
};

export default definition;
