import { RoleDefinition } from "../../types";
import { getRole } from "../../index";
import { isAlive } from "../../../types";
import { useI18n } from "../../../i18n";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout } from "../../../../components/layouts";
import { MysticDivider, RoleRevealBadge } from "../../../../components/items";
import { Button, Icon } from "../../../../components/atoms";

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
        const executedRole = executedPlayer ? getRole(executedPlayer.roleId) : null;

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
                            },
                        },
                    ],
                });
            }
        };

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

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
