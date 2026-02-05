import { useState } from "react";
import { RoleDefinition } from "../../types";
import { getRole } from "../../index";
import { useI18n } from "../../../i18n";
import { hasEffect, Game, PlayerState } from "../../../types";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout } from "../../../../components/layouts";
import { MysticDivider, RoleRevealBadge } from "../../../../components/items";
import { SelectablePlayerItem } from "../../../../components/inputs";
import { Button, Icon } from "../../../../components/atoms";

type Phase = "select_player" | "show_role";

// Helper to check if a player was killed this night
function wasKilledThisNight(game: Game, playerId: string): boolean {
    let nightStartIndex = -1;

    for (let i = game.history.length - 1; i >= 0; i--) {
        const entry = game.history[i];
        if (entry.type === "night_started") {
            nightStartIndex = i;
            break;
        }
    }

    if (nightStartIndex !== -1) {
        for (let i = nightStartIndex; i < game.history.length; i++) {
            const entry = game.history[i];
            if (
                entry.type === "night_action" &&
                entry.data.action === "kill" &&
                entry.data.targetId === playerId
            ) {
                return true;
            }
        }
    }

    return false;
}

const definition: RoleDefinition = {
    id: "ravenkeeper",
    team: "townsfolk",
    icon: "birdHouse",
    nightOrder: 35, // Wakes after demon kills, before undertaker

    // Ravenkeeper wakes when killed - no isAlive check since they wake BECAUSE they died
    shouldWake: (game: Game, player: PlayerState) => {
        const round = game.history.at(-1)?.stateAfter.round ?? 0;
        if (round <= 1) return false; // Skip first night (no deaths on first night)
        return wasKilledThisNight(game, player.id);
    },

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("select_player");
        const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

        // We know we were killed (shouldWake returned true)
        const otherPlayers = state.players.filter((p) => p.id !== player.id);

        const handleSelectPlayer = (playerId: string) => {
            setSelectedPlayer(playerId);
        };

        const handleShowRole = () => {
            if (!selectedPlayer) return;
            setPhase("show_role");
        };

        const handleComplete = () => {
            if (!selectedPlayer) return;

            const targetPlayer = state.players.find((p) => p.id === selectedPlayer);
            if (!targetPlayer) return;

            const targetRole = getRole(targetPlayer.roleId);
            if (!targetRole) return;

            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.ravenkeeper.history.sawRole",
                                params: {
                                    player: player.id,
                                    target: targetPlayer.id,
                                    role: targetRole.id,
                                },
                            },
                        ],
                        data: {
                            roleId: "ravenkeeper",
                            playerId: player.id,
                            action: "saw_role",
                            targetId: targetPlayer.id,
                            targetRoleId: targetRole.id,
                        },
                    },
                ],
            });
        };

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        // Phase 1: Select a player
        if (phase === "select_player") {
            return (
                <NightActionLayout
                    player={player}
                    title={t.game.ravenkeeperInfo}
                    description={t.game.selectPlayerToSeeRole}
                >
                    <div className="space-y-2 mb-6">
                        {otherPlayers.map((p) => {
                            const isDead = hasEffect(p, "dead");
                            const isSelected = selectedPlayer === p.id;

                            return (
                                <SelectablePlayerItem
                                    key={p.id}
                                    playerName={p.name}
                                    roleName={isDead ? t.effects.dead.name : ""}
                                    roleIcon={isDead ? "skull" : "user"}
                                    isSelected={isSelected}
                                    isDisabled={false}
                                    onClick={() => handleSelectPlayer(p.id)}
                                />
                            );
                        })}
                    </div>

                    <Button
                        onClick={handleShowRole}
                        fullWidth
                        size="lg"
                        disabled={!selectedPlayer}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 font-tarot uppercase tracking-wider disabled:opacity-50"
                    >
                        <Icon name="eye" size="md" className="mr-2" />
                        {t.common.confirm}
                    </Button>
                </NightActionLayout>
            );
        }

        // Phase 2: Show the selected player's role
        const targetPlayer = state.players.find((p) => p.id === selectedPlayer);
        const targetRole = targetPlayer ? getRole(targetPlayer.roleId) : null;

        return (
            <NightActionLayout
                player={player}
                title={t.game.ravenkeeperInfo}
                description={t.game.playerRoleIs}
            >
                {targetPlayer && (
                    <div className="text-center mb-4">
                        <span className="text-lg text-stone-300">{targetPlayer.name}</span>
                    </div>
                )}

                <MysticDivider />

                {targetRole && (
                    <RoleRevealBadge
                        icon={targetRole.icon}
                        roleName={getRoleName(targetRole.id)}
                        label={t.game.playerRoleIs}
                    />
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
