import { useState } from "react";
import { RoleDefinition } from "../../types";
import { useI18n } from "../../../i18n";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";
import { NightActionLayout, NightStepListLayout } from "../../../../components/layouts";
import type { NightStep } from "../../../../components/layouts";
import { PlayerPickerList } from "../../../../components/inputs";
import { Button, Icon } from "../../../../components/atoms";
import { isAlive } from "../../../types";

/**
 * The Poisoner — Minion role.
 *
 * Each night (except the first), chooses a player to poison.
 * The poisoned effect expires at "end_of_day" — it lasts through
 * the current night AND the following day, affecting both night
 * abilities and day-phase abilities (Slayer, win conditions, etc.).
 * It is removed when the next night starts.
 */
const definition: RoleDefinition = {
    id: "poisoner",
    team: "minion",
    icon: "flask",
    nightOrder: 5, // Very early — before all info roles

    shouldWake: (game, player) =>
        isAlive(player) &&
        (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

    nightSteps: [
        {
            id: "choose_target",
            icon: "flask",
            getLabel: (t) => t.game.stepChooseTarget,
        },
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<"step_list" | "choose_target">("step_list");
        const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

        const alivePlayers = state.players.filter(
            (p) => isAlive(p) && p.id !== player.id
        );

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        const handleConfirm = () => {
            if (!selectedTarget) return;

            const target = state.players.find((p) => p.id === selectedTarget);
            if (!target) return;

            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.poisoner.history.poisonedPlayer",
                                params: {
                                    player: player.id,
                                    target: target.id,
                                },
                            },
                        ],
                        data: {
                            roleId: "poisoner",
                            playerId: player.id,
                            action: "poison",
                            targetId: target.id,
                        },
                    },
                ],
                addEffects: {
                    [target.id]: [
                        {
                            type: "poisoned",
                            data: { source: "poisoner" },
                            expiresAt: "end_of_day",
                        },
                    ],
                },
            });
        };

        // Step List Phase
        if (phase === "step_list") {
            const steps: NightStep[] = [
                {
                    id: "choose_target",
                    icon: "flask",
                    label: t.game.stepChooseTarget,
                    status: "pending",
                },
            ];

            return (
                <NightStepListLayout
                    icon="flask"
                    roleName={getRoleName("poisoner")}
                    playerName={player.name}
                    isEvil
                    steps={steps}
                    onSelectStep={() => setPhase("choose_target")}
                />
            );
        }

        return (
            <NightActionLayout
                player={player}
                title={t.game.poisonerInfo}
                description={t.game.selectPlayerToPoison}
            >
                <div className="mb-6">
                    <PlayerPickerList
                        players={alivePlayers}
                        selected={selectedTarget ? [selectedTarget] : []}
                        onSelect={setSelectedTarget}
                        selectionCount={1}
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
                    <Icon name="flask" size="md" className="mr-2" />
                    {t.common.confirm}
                </Button>
            </NightActionLayout>
        );
    },
};

export default definition;
