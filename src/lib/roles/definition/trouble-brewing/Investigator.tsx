import { useState } from "react";
import { RoleDefinition } from "../../types";
import { isAlive } from "../../../types";
import { getRole } from "../../index";
import { useI18n } from "../../../i18n";
import { RoleCard } from "../../../../components/items/RoleCard";
import { NightActionLayout, NarratorSetupLayout } from "../../../../components/layouts";
import {
    StepSection,
    AlertBox,
    PlayerNameCard,
    RoleRevealBadge,
    MysticDivider,
} from "../../../../components/items";
import { SelectablePlayerItem, SelectableRoleItem } from "../../../../components/inputs";
import { Button, Icon } from "../../../../components/atoms";

type Phase = "narrator_setup" | "player_view";

const definition: RoleDefinition = {
    id: "investigator",
    team: "townsfolk",
    icon: "search",
    nightOrder: 12,
    shouldWake: (game, player) => isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("narrator_setup");
        const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
        const [selectedMinion, setSelectedMinion] = useState<string | null>(null);

        const otherPlayers = state.players.filter((p) => p.id !== player.id);

        // Count minions AND Recluses in selection (Recluse can register as Minion)
        const minionsOrRecluseInSelection = selectedPlayers.filter((playerId) => {
            const p = state.players.find((pl) => pl.id === playerId);
            if (!p) return false;
            const role = getRole(p.roleId);
            return role?.team === "minion" || p.roleId === "recluse";
        });

        const canProceedToPlayer =
            selectedPlayers.length === 2 &&
            minionsOrRecluseInSelection.length >= 1 &&
            selectedMinion !== null;

        const handlePlayerToggle = (playerId: string) => {
            setSelectedPlayers((prev) => {
                if (prev.includes(playerId)) {
                    if (playerId === selectedMinion) {
                        setSelectedMinion(null);
                    }
                    return prev.filter((id) => id !== playerId);
                } else if (prev.length < 2) {
                    return [...prev, playerId];
                }
                return prev;
            });
        };

        const handleShowToPlayer = () => {
            if (!canProceedToPlayer) return;
            setPhase("player_view");
        };

        const handleComplete = () => {
            if (!selectedMinion) return;

            const minionPlayer = state.players.find((p) => p.id === selectedMinion);
            if (!minionPlayer) return;

            const player1 = state.players.find((p) => p.id === selectedPlayers[0]);
            const player2 = state.players.find((p) => p.id === selectedPlayers[1]);
            if (!player1 || !player2) return;

            // If the "minion" is actually a Recluse registering as Minion, log accordingly
            const isRecluseAsMinion = minionPlayer.roleId === "recluse";

            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.investigator.history.discoveredMinion",
                                params: {
                                    player: player.id,
                                    player1: player1.id,
                                    player2: player2.id,
                                    role: minionPlayer.roleId,
                                },
                            },
                        ],
                        data: {
                            roleId: "investigator",
                            playerId: player.id,
                            action: "see_minion",
                            shownPlayers: selectedPlayers,
                            minionId: selectedMinion,
                            minionRoleId: minionPlayer.roleId,
                            recluseAsMinion: isRecluseAsMinion || undefined,
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
            return (
                <NarratorSetupLayout
                    icon="search"
                    roleName={getRoleName("investigator")}
                    playerName={getPlayerName(player.id)}
                    onShowToPlayer={handleShowToPlayer}
                    showToPlayerDisabled={!canProceedToPlayer}
                >
                    <StepSection
                        step={1}
                        label={t.game.selectTwoPlayers}
                        count={{ current: selectedPlayers.length, max: 2 }}
                    >
                        {otherPlayers.map((p) => {
                            const role = getRole(p.roleId);
                            const isSelected = selectedPlayers.includes(p.id);
                            const isMinion = role?.team === "minion";
                            const isRecluse = p.roleId === "recluse";

                            return (
                                <SelectablePlayerItem
                                    key={p.id}
                                    playerName={p.name}
                                    roleName={getRoleName(p.roleId)}
                                    roleIcon={role?.icon ?? "user"}
                                    isSelected={isSelected}
                                    isDisabled={!isSelected && selectedPlayers.length >= 2}
                                    highlightTeam={isMinion ? "minion" : isRecluse ? "outsider" : undefined}
                                    teamLabel={isMinion ? t.teams.minion.name : isRecluse ? t.game.recluseAsMinion : undefined}
                                    onClick={() => handlePlayerToggle(p.id)}
                                />
                            );
                        })}
                    </StepSection>

                    {selectedPlayers.length === 2 && minionsOrRecluseInSelection.length > 0 && (
                        <StepSection step={2} label={t.game.selectWhichRoleToShow}>
                            {minionsOrRecluseInSelection.map((playerId) => {
                                const p = state.players.find((pl) => pl.id === playerId);
                                if (!p) return null;
                                const role = getRole(p.roleId);
                                const isRecluse = p.roleId === "recluse";

                                return (
                                    <SelectableRoleItem
                                        key={playerId}
                                        playerName={p.name}
                                        roleName={isRecluse ? t.game.recluseAsMinion : getRoleName(p.roleId)}
                                        roleIcon={role?.icon ?? "user"}
                                        isSelected={selectedMinion === playerId}
                                        onClick={() => setSelectedMinion(playerId)}
                                    />
                                );
                            })}
                        </StepSection>
                    )}

                    {selectedPlayers.length === 2 && minionsOrRecluseInSelection.length === 0 && (
                        <AlertBox message={t.game.mustIncludeMinion} />
                    )}
                </NarratorSetupLayout>
            );
        }

        // Player View Phase
        const minionPlayer = state.players.find((p) => p.id === selectedMinion);
        const minionRole = minionPlayer ? getRole(minionPlayer.roleId) : null;
        const isRecluseAsMinion = minionPlayer?.roleId === "recluse";
        const player1 = state.players.find((p) => p.id === selectedPlayers[0]);
        const player2 = state.players.find((p) => p.id === selectedPlayers[1]);

        return (
            <NightActionLayout
                player={player}
                title={t.game.investigatorInfo}
                description={t.game.oneOfTheseIsTheMinion}
            >
                <div className="space-y-3 mb-6">
                    {player1 && <PlayerNameCard name={player1.name} />}
                    {player2 && <PlayerNameCard name={player2.name} />}
                </div>

                <MysticDivider />

                {minionRole && (
                    <RoleRevealBadge
                        icon={minionRole.icon}
                        roleName={isRecluseAsMinion ? t.game.recluseAsMinion : getRoleName(minionRole.id)}
                        label={t.game.oneOfThemIsThe}
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
