import { useState } from "react";
import { RoleDefinition } from "../../types";
import { getRole } from "../../index";
import { useI18n } from "../../../i18n";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout } from "../../../../components/layouts/NightActionLayout";
import { Button, Icon, Badge } from "../../../../components/atoms";
import { cn } from "../../../utils";

type Phase = "narrator_setup" | "player_view" | "no_outsiders_view";

const definition: RoleDefinition = {
    id: "librarian",
    team: "townsfolk",
    icon: "bookMarked",
    nightOrder: 11, // Wakes after Washerwoman
    firstNightOnly: true,

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("narrator_setup");
        const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
        const [selectedOutsider, setSelectedOutsider] = useState<string | null>(null);

        // Get all other players
        const otherPlayers = state.players.filter((p) => p.id !== player.id);

        // Check if there are any Outsiders in the game
        const outsidersInGame = state.players.filter((p) => {
            const role = getRole(p.roleId);
            return role?.team === "outsider";
        });

        const hasOutsiders = outsidersInGame.length > 0;

        // Get outsiders among selected players
        const outsidersInSelection = selectedPlayers.filter((playerId) => {
            const p = state.players.find((pl) => pl.id === playerId);
            if (!p) return false;
            const role = getRole(p.roleId);
            return role?.team === "outsider";
        });

        const canProceedToPlayer =
            selectedPlayers.length === 2 &&
            outsidersInSelection.length >= 1 &&
            selectedOutsider !== null;

        const handlePlayerToggle = (playerId: string) => {
            setSelectedPlayers((prev) => {
                if (prev.includes(playerId)) {
                    // If removing the selected outsider, clear it
                    if (playerId === selectedOutsider) {
                        setSelectedOutsider(null);
                    }
                    return prev.filter((id) => id !== playerId);
                } else if (prev.length < 2) {
                    return [...prev, playerId];
                }
                return prev;
            });
        };

        const handleShowToPlayer = () => {
            if (!hasOutsiders) {
                setPhase("no_outsiders_view");
                return;
            }
            if (!canProceedToPlayer) return;
            setPhase("player_view");
        };

        const handleCompleteNoOutsiders = () => {
            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.librarian.history.noOutsiders",
                                params: {
                                    player: player.id,
                                },
                            },
                        ],
                        data: {
                            roleId: "librarian",
                            playerId: player.id,
                            action: "no_outsiders",
                        },
                    },
                ],
            });
        };

        const handleComplete = () => {
            if (!selectedOutsider) return;

            const outsiderPlayer = state.players.find((p) => p.id === selectedOutsider);
            if (!outsiderPlayer) return;

            const player1 = state.players.find((p) => p.id === selectedPlayers[0]);
            const player2 = state.players.find((p) => p.id === selectedPlayers[1]);
            if (!player1 || !player2) return;

            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.librarian.history.discoveredOutsider",
                                params: {
                                    player: player.id,
                                    player1: player1.id,
                                    player2: player2.id,
                                    role: outsiderPlayer.roleId,
                                },
                            },
                        ],
                        data: {
                            roleId: "librarian",
                            playerId: player.id,
                            action: "see_outsider",
                            shownPlayers: selectedPlayers,
                            outsiderId: selectedOutsider,
                            outsiderRoleId: outsiderPlayer.roleId,
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
            return state.players.find((p) => p.id === playerId)?.name ?? "Unknown";
        };

        // Narrator Setup Phase
        if (phase === "narrator_setup") {
            // If no outsiders, show a different UI
            if (!hasOutsiders) {
                return (
                    <div className="min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-b from-blue-900/50 to-transparent px-4 py-6 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                                    <Icon name="bookMarked" size="2xl" className="text-blue-300" />
                                </div>
                            </div>
                            <h1 className="font-tarot text-xl text-parchment-100 tracking-wider uppercase">
                                {t.game.narratorSetup}
                            </h1>
                            <p className="text-parchment-400 text-sm mt-1">
                                {getRoleName("librarian")} - {getPlayerName(player.id)}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-4 pb-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
                            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-6 text-center">
                                <Icon name="bookMarked" size="xl" className="text-blue-300 mx-auto mb-3" />
                                <h2 className="text-parchment-100 font-tarot text-lg mb-2">
                                    {t.game.noOutsidersInGame}
                                </h2>
                                <p className="text-parchment-400 text-sm">
                                    {t.game.noOutsidersMessage}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-grimoire-dark/95 backdrop-blur-sm border-t border-blue-500/30 px-4 py-4">
                            <div className="max-w-lg mx-auto">
                                <Button
                                    onClick={handleShowToPlayer}
                                    fullWidth
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-700 font-tarot uppercase tracking-wider"
                                >
                                    <Icon name="eye" size="md" className="mr-2" />
                                    {t.game.confirmNoOutsiders}
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-b from-blue-900/50 to-transparent px-4 py-6 text-center">
                        <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                                <Icon name="bookMarked" size="2xl" className="text-blue-300" />
                            </div>
                        </div>
                        <h1 className="font-tarot text-xl text-parchment-100 tracking-wider uppercase">
                            {t.game.narratorSetup}
                        </h1>
                        <p className="text-parchment-400 text-sm mt-1">
                            {getRoleName("librarian")} - {getPlayerName(player.id)}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto">
                        {/* Step 1: Select 2 players */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 text-xs flex items-center justify-center font-bold">
                                    1
                                </span>
                                <span className="text-parchment-300 text-sm">
                                    {t.game.selectTwoPlayers}
                                </span>
                                <span className="text-parchment-500 text-xs">
                                    ({selectedPlayers.length}/2)
                                </span>
                            </div>
                            <div className="space-y-2">
                                {otherPlayers.map((p) => {
                                    const role = getRole(p.roleId);
                                    const isSelected = selectedPlayers.includes(p.id);
                                    const isOutsider = role?.team === "outsider";

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePlayerToggle(p.id)}
                                            disabled={!isSelected && selectedPlayers.length >= 2}
                                            className={cn(
                                                "w-full p-3 rounded-lg border flex items-center justify-between transition-all",
                                                isSelected
                                                    ? "bg-blue-900/40 border-blue-500/50"
                                                    : selectedPlayers.length >= 2
                                                        ? "bg-white/5 border-white/10 opacity-50"
                                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon
                                                    name={role?.icon ?? "user"}
                                                    size="md"
                                                    className={isSelected ? "text-blue-300" : "text-parchment-400"}
                                                />
                                                <div className="text-left">
                                                    <div className="text-parchment-100 font-medium">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-parchment-500 flex items-center gap-1">
                                                        {getRoleName(p.roleId)}
                                                        {isOutsider && (
                                                            <Badge variant="outsider" className="text-[10px] px-1 py-0">
                                                                {t.teams.outsider.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Icon name="check" size="md" className="text-blue-300" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 2: Select which outsider's role to show */}
                        {selectedPlayers.length === 2 && outsidersInSelection.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 text-xs flex items-center justify-center font-bold">
                                        2
                                    </span>
                                    <span className="text-parchment-300 text-sm">
                                        {t.game.selectWhichRoleToShow}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {outsidersInSelection.map((playerId) => {
                                        const p = state.players.find((pl) => pl.id === playerId);
                                        if (!p) return null;
                                        const role = getRole(p.roleId);
                                        const isSelected = selectedOutsider === playerId;

                                        return (
                                            <button
                                                key={playerId}
                                                onClick={() => setSelectedOutsider(playerId)}
                                                className={cn(
                                                    "w-full p-3 rounded-lg border flex items-center justify-between transition-all",
                                                    isSelected
                                                        ? "bg-mystic-gold/20 border-mystic-gold/50"
                                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        name={role?.icon ?? "user"}
                                                        size="md"
                                                        className={isSelected ? "text-mystic-gold" : "text-parchment-400"}
                                                    />
                                                    <div className="text-left">
                                                        <div className="text-parchment-100 font-medium">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-xs text-mystic-gold">
                                                            {getRoleName(p.roleId)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Icon name="check" size="md" className="text-mystic-gold" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Warning if no outsider selected */}
                        {selectedPlayers.length === 2 && outsidersInSelection.length === 0 && (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 text-red-300">
                                    <Icon name="alertTriangle" size="md" />
                                    <span className="text-sm">{t.game.mustIncludeOutsider}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-grimoire-dark/95 backdrop-blur-sm border-t border-blue-500/30 px-4 py-4">
                        <div className="max-w-lg mx-auto">
                            <Button
                                onClick={handleShowToPlayer}
                                disabled={!canProceedToPlayer}
                                fullWidth
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-indigo-700 font-tarot uppercase tracking-wider"
                            >
                                <Icon name="eye" size="md" className="mr-2" />
                                {t.game.showToPlayer}
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        // No Outsiders View Phase
        if (phase === "no_outsiders_view") {
            return (
                <NightActionLayout
                    player={player}
                    title={t.game.librarianInfo}
                    description={t.game.noOutsidersMessage}
                >
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-mystic-gold/10 border border-mystic-gold/30">
                            <Icon name="sparkles" size="xl" className="text-mystic-gold" />
                            <span className="font-tarot text-xl text-mystic-gold uppercase tracking-wider">
                                {t.game.noOutsidersInGame}
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleCompleteNoOutsiders}
                        fullWidth
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 font-tarot uppercase tracking-wider"
                    >
                        <Icon name="check" size="md" className="mr-2" />
                        {t.common.iUnderstandMyRole}
                    </Button>
                </NightActionLayout>
            );
        }

        // Player View Phase (with outsiders)
        const outsiderPlayer = state.players.find((p) => p.id === selectedOutsider);
        const outsiderRole = outsiderPlayer ? getRole(outsiderPlayer.roleId) : null;
        const player1 = state.players.find((p) => p.id === selectedPlayers[0]);
        const player2 = state.players.find((p) => p.id === selectedPlayers[1]);

        return (
            <NightActionLayout
                player={player}
                title={t.game.librarianInfo}
                description={t.game.oneOfTheseIsTheOutsider}
            >
                {/* The two players */}
                <div className="space-y-3 mb-6">
                    {[player1, player2].map((p) => {
                        if (!p) return null;
                        return (
                            <div
                                key={p.id}
                                className="p-4 rounded-lg bg-white/5 border border-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                                        <Icon name="user" size="md" className="text-blue-300" />
                                    </div>
                                    <span className="text-parchment-100 font-medium text-lg">
                                        {p.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Divider */}
                <div className="divider-mystic mb-6">
                    <Icon name="sparkles" size="sm" className="text-mystic-gold/40" />
                </div>

                {/* The role one of them has */}
                <div className="text-center mb-6">
                    <p className="text-parchment-400 text-sm mb-3">
                        {t.game.oneOfThemIsThe}
                    </p>
                    {outsiderRole && (
                        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-mystic-gold/10 border border-mystic-gold/30">
                            <Icon name={outsiderRole.icon} size="xl" className="text-mystic-gold" />
                            <span className="font-tarot text-2xl text-mystic-gold uppercase tracking-wider">
                                {getRoleName(outsiderRole.id)}
                            </span>
                        </div>
                    )}
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
