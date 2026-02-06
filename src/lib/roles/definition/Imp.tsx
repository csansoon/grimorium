import { useState } from "react";
import { RoleDefinition } from "../types";
import { isAlive, hasEffect, PlayerState } from "../../types";
import { useI18n } from "../../i18n";
import { RoleCard } from "../../../components/items/RoleCard";
import { NightActionLayout } from "../../../components/layouts/NightActionLayout";
import { PlayerSelector } from "../../../components/inputs";
import { Button, Icon } from "../../../components/atoms";

type Phase =
    | { type: "select_target" }
    | { type: "bounce_redirect"; originalTargetId: string }; // Target had bounce — narrator picks who dies

const definition: RoleDefinition = {
    id: "imp",
    team: "demon",
    icon: "skull",
    nightOrder: 30, // Demon kills before death-triggered abilities like Ravenkeeper
    shouldWake: (game, player) => isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
        const [phase, setPhase] = useState<Phase>({ type: "select_target" });
        const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

        const alivePlayers = state.players.filter(
            (p) => isAlive(p) && p.id !== player.id
        );

        const handleConfirmTarget = () => {
            if (!selectedTarget) return;

            const target = state.players.find((p) => p.id === selectedTarget);
            if (!target) return;

            // Check if the target has the Bounce effect (Mayor's redirect)
            if (hasEffect(target, "bounce")) {
                setPhase({ type: "bounce_redirect", originalTargetId: target.id });
                return;
            }

            // Normal kill flow
            resolveKill(target);
        };

        const handleConfirmRedirect = () => {
            if (phase.type !== "bounce_redirect") return;
            if (!redirectTarget) return;

            const originalTarget = state.players.find((p) => p.id === phase.originalTargetId);
            if (!originalTarget) return;

            const newTarget = state.players.find((p) => p.id === redirectTarget);
            if (!newTarget) return;

            // If narrator chose the original target, kill them normally (ignore bounce)
            if (newTarget.id === originalTarget.id) {
                onComplete({
                    entries: [
                        {
                            type: "night_action",
                            message: [
                                {
                                    type: "i18n",
                                    key: "roles.imp.history.choseToKill",
                                    params: {
                                        player: player.id,
                                        target: originalTarget.id,
                                    },
                                },
                            ],
                            data: {
                                roleId: "imp",
                                playerId: player.id,
                                action: "kill",
                                targetId: originalTarget.id,
                            },
                        },
                    ],
                    addEffects: {
                        [originalTarget.id]: [{ type: "dead", data: { cause: "imp" } }],
                    },
                });
            } else {
                // Kill was redirected to a different player
                onComplete({
                    entries: [
                        {
                            type: "night_action",
                            message: [
                                {
                                    type: "i18n",
                                    key: "roles.imp.history.bounceRedirected",
                                    params: {
                                        player: player.id,
                                        target: originalTarget.id,
                                        redirect: newTarget.id,
                                    },
                                },
                            ],
                            data: {
                                roleId: "imp",
                                playerId: player.id,
                                action: "kill_redirected",
                                targetId: originalTarget.id,
                                redirectTargetId: newTarget.id,
                            },
                        },
                    ],
                    addEffects: {
                        [newTarget.id]: [{ type: "dead", data: { cause: "imp" } }],
                    },
                });
            }
        };

        const resolveKill = (target: PlayerState) => {
            const targetIsSafe = hasEffect(target, "safe");

            if (targetIsSafe) {
                onComplete({
                    entries: [
                        {
                            type: "night_action",
                            message: [
                                {
                                    type: "i18n",
                                    key: "roles.imp.history.failedToKill",
                                    params: {
                                        player: player.id,
                                        target: target.id,
                                    },
                                },
                            ],
                            data: {
                                roleId: "imp",
                                playerId: player.id,
                                action: "kill_failed",
                                targetId: target.id,
                                reason: "safe",
                            },
                        },
                    ],
                });
            } else {
                onComplete({
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
                            },
                        },
                    ],
                    addEffects: {
                        [target.id]: [{ type: "dead", data: { cause: "imp" } }],
                    },
                });
            }
        };

        // Phase: Redirect after Bounce
        if (phase.type === "bounce_redirect") {
            const originalTarget = state.players.find((p) => p.id === phase.originalTargetId);

            return (
                <NightActionLayout
                    player={player}
                    title={t.roles.imp.bounceTitle}
                    description={t.roles.imp.bounceDescription.replace("{target}", originalTarget?.name ?? "?")}
                >
                    <div className="mb-6">
                        <PlayerSelector
                            players={alivePlayers}
                            selected={redirectTarget}
                            onSelect={setRedirectTarget}
                            showRoles
                            excludeEffects={["safe"]}
                            selectedIcon="skull"
                            variant="red"
                            getLabel={(p) =>
                                p.id === phase.originalTargetId
                                    ? t.roles.imp.bounceOriginalLabel
                                    : undefined
                            }
                        />
                    </div>

                    <Button
                        onClick={handleConfirmRedirect}
                        disabled={!redirectTarget}
                        fullWidth
                        size="lg"
                        className="bg-gradient-to-r from-red-700 to-red-900 font-tarot uppercase tracking-wider"
                    >
                        <Icon name="skull" size="md" className="mr-2" />
                        {t.common.confirm}
                    </Button>
                </NightActionLayout>
            );
        }

        // Phase: Select target
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
                    onClick={handleConfirmTarget}
                    disabled={!selectedTarget}
                    fullWidth
                    size="lg"
                    className="bg-gradient-to-r from-red-700 to-red-900 font-tarot uppercase tracking-wider"
                >
                    <Icon name="skull" size="md" className="mr-2" />
                    {t.game.confirmKill}
                </Button>
            </NightActionLayout>
        );
    },
};

export default definition;
