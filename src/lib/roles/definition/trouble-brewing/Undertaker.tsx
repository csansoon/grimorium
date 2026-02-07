import { useState } from "react";
import { RoleDefinition } from "../../types";
import { getRole, ROLES } from "../../index";
import { isAlive } from "../../../types";
import { useI18n, interpolate } from "../../../i18n";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout, NarratorSetupLayout } from "../../../../components/layouts";
import { MysticDivider, RoleRevealBadge, StepSection } from "../../../../components/items";
import { SelectableRoleItem } from "../../../../components/inputs";
import { Button, Icon } from "../../../../components/atoms";

type Phase = "recluse_setup" | "player_view";

// Helper to find execution from the previous day
function findExecutedPlayerId(game: { history: Array<{ type: string; data: Record<string, unknown> }> }): string | null {
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

// Get all Minion and Demon roles available in the game
function getEvilRoles() {
    return Object.values(ROLES).filter(
        (role) => role.team === "minion" || role.team === "demon"
    );
}

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

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ game, state, player, onComplete }) => {
        const { t } = useI18n();

        // Find the executed player (we know there was one because shouldWake returned true)
        const executedPlayerId = findExecutedPlayerId(game);
        const executedPlayer = executedPlayerId
            ? state.players.find((p) => p.id === executedPlayerId)
            : null;
        const isRecluse = executedPlayer?.roleId === "recluse";

        const [phase, setPhase] = useState<Phase>(
            isRecluse ? "recluse_setup" : "player_view"
        );
        const [displayRoleId, setDisplayRoleId] = useState<string | null>(null);

        const handleRecluseDone = () => {
            if (!displayRoleId) return;
            setPhase("player_view");
        };

        const handleComplete = () => {
            if (!executedPlayer) return;

            // Use overridden role if Recluse, otherwise use actual role
            const shownRoleId = displayRoleId ?? executedPlayer.roleId;
            const shownRole = getRole(shownRoleId);
            if (!shownRole) return;

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
                                    role: shownRole.id,
                                },
                            },
                        ],
                        data: {
                            roleId: "undertaker",
                            playerId: player.id,
                            action: "saw_executed",
                            executedPlayerId: executedPlayer.id,
                            executedRoleId: shownRole.id,
                            actualRoleId: executedPlayer.roleId,
                            recluseOverride: displayRoleId ? true : undefined,
                        },
                    },
                ],
            });
        };

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        // Phase 0: Recluse Setup - Narrator picks displayed role
        if (phase === "recluse_setup" && executedPlayer) {
            const evilRoles = getEvilRoles();

            // Options: own role (Recluse) + all Minion/Demon roles
            const roleOptions = [
                { id: "recluse", label: t.game.recluseShowAsOwnRole, icon: "flowerLotus" as const },
                ...evilRoles.map((r) => ({
                    id: r.id,
                    label: getRoleName(r.id),
                    icon: r.icon,
                })),
            ];

            return (
                <NarratorSetupLayout
                    icon="shovel"
                    roleName={getRoleName("undertaker")}
                    playerName={executedPlayer.name}
                    onShowToPlayer={handleRecluseDone}
                    showToPlayerDisabled={!displayRoleId}
                >
                    <StepSection
                        step={1}
                        label={interpolate(t.game.recluseSelectDisplayRole, {
                            player: executedPlayer.name,
                        })}
                    >
                        {roleOptions.map((option) => (
                            <SelectableRoleItem
                                key={option.id}
                                playerName=""
                                roleName={option.label}
                                roleIcon={option.icon}
                                isSelected={displayRoleId === option.id}
                                onClick={() => setDisplayRoleId(option.id)}
                            />
                        ))}
                    </StepSection>
                </NarratorSetupLayout>
            );
        }

        // Player View - Show the executed player's role
        const shownRoleId = displayRoleId ?? executedPlayer?.roleId;
        const executedRole = shownRoleId ? getRole(shownRoleId) : null;

        return (
            <NightActionLayout
                player={player}
                title={t.game.undertakerInfo}
                description={t.game.executedPlayerRole}
            >
                {executedRole && (
                    <>
                        <MysticDivider />
                        <RoleRevealBadge
                            icon={executedRole.icon}
                            roleName={getRoleName(executedRole.id)}
                            label={t.game.executedPlayerRole}
                        />
                    </>
                )}

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
