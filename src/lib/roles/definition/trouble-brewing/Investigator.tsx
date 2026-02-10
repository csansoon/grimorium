import { useState } from "react";
import { RoleDefinition } from "../../types";
import { isAlive } from "../../../types";
import { getRole, getAllRoles } from "../../index";
import { getTeam } from "../../../teams";
import { useI18n } from "../../../i18n";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";
import { RoleCard } from "../../../../components/items/RoleCard";
import { TeamBackground, CardLink } from "../../../../components/items/TeamBackground";
import { NarratorSetupLayout, NightStepListLayout } from "../../../../components/layouts";
import type { NightStep } from "../../../../components/layouts";
import {
    StepSection,
    AlertBox,
} from "../../../../components/items";
import { PlayerPickerList, RolePickerGrid } from "../../../../components/inputs";
import { Icon } from "../../../../components/atoms";
import { perceive, canRegisterAsTeam } from "../../../pipeline";
import { isMalfunctioning } from "../../../effects";

type Phase = "step_list" | "narrator_setup" | "player_view";

const definition: RoleDefinition = {
    id: "investigator",
    team: "townsfolk",
    icon: "search",
    nightOrder: 12,
    shouldWake: (game, player) => isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

    nightSteps: [
        {
            id: "narrator_setup",
            icon: "search",
            getLabel: (t) => t.game.stepNarratorSetup,
        },
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const [phase, setPhase] = useState<Phase>("step_list");
        const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
        const [selectedMinion, setSelectedMinion] = useState<string | null>(null);
        const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

        const otherPlayers = state.players.filter((p) => p.id !== player.id);

        // All defined minion roles (for misregistration role picker)
        const minionRoles = getAllRoles().filter((r) => r.team === "minion");

        const minionsInSelection = selectedPlayers.filter((playerId) => {
            const p = state.players.find((pl) => pl.id === playerId);
            if (!p) return false;
            const perception = perceive(p, player, "team", state);
            return perception.team === "minion" || canRegisterAsTeam(p, "minion");
        });

        const canProceedToPlayer =
            selectedPlayers.length === 2 &&
            minionsInSelection.length >= 1 &&
            selectedMinion !== null &&
            selectedRoleId !== null;

        const handlePlayerToggle = (playerId: string) => {
            setSelectedPlayers((prev) => {
                if (prev.includes(playerId)) {
                    if (playerId === selectedMinion) {
                        setSelectedMinion(null);
                        setSelectedRoleId(null);
                    }
                    return prev.filter((id) => id !== playerId);
                } else if (prev.length < 2) {
                    return [...prev, playerId];
                }
                return prev;
            });
        };

        const handleSelectRole = (playerId: string, roleId: string) => {
            setSelectedMinion(playerId);
            setSelectedRoleId(roleId);
        };

        const handleShowToPlayer = () => {
            if (!canProceedToPlayer) return;
            setPhase("player_view");
        };

        const handleComplete = () => {
            if (!selectedMinion || !selectedRoleId) return;

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
                                key: "roles.investigator.history.discoveredMinion",
                                params: {
                                    player: player.id,
                                    player1: player1.id,
                                    player2: player2.id,
                                    role: selectedRoleId,
                                },
                            },
                        ],
                        data: {
                            roleId: "investigator",
                            playerId: player.id,
                            action: "see_minion",
                            shownPlayers: selectedPlayers,
                            minionId: selectedMinion,
                            shownRoleId: selectedRoleId,
                            ...(isMalfunctioning(player) ? { malfunctioned: true } : {}),
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

        // Step List Phase
        if (phase === "step_list") {
            const steps: NightStep[] = [
                {
                    id: "narrator_setup",
                    icon: "search",
                    label: t.game.stepNarratorSetup,
                    status: "pending",
                },
            ];

            return (
                <NightStepListLayout
                    icon="search"
                    roleName={getRoleName("investigator")}
                    playerName={player.name}
                    steps={steps}
                    onSelectStep={() => setPhase("narrator_setup")}
                />
            );
        }

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
                        <PlayerPickerList
                            players={otherPlayers}
                            selected={selectedPlayers}
                            onSelect={handlePlayerToggle}
                            selectionCount={2}
                            variant="blue"
                        />
                    </StepSection>

                    {selectedPlayers.length === 2 && minionsInSelection.length > 0 && (
                        <StepSection step={2} label={t.game.selectWhichRoleToShow}>
                            {minionsInSelection.map((playerId) => {
                                const p = state.players.find((pl) => pl.id === playerId);
                                if (!p) return null;
                                const pPerception = perceive(p, player, "team", state);

                                // Determine available roles for this player
                                const availableRoles = pPerception.team === "minion"
                                    ? (() => {
                                        const rolePerception = perceive(p, player, "role", state);
                                        const perceivedRole = getRole(rolePerception.roleId);
                                        return perceivedRole ? [perceivedRole] : [];
                                    })()
                                    : minionRoles;

                                const currentSelected =
                                    selectedMinion === playerId && selectedRoleId
                                        ? [selectedRoleId]
                                        : [];

                                return (
                                    <div key={playerId} className="mb-3">
                                        <div className="text-xs font-medium text-parchment-400 mb-1.5 ml-1">
                                            <Icon name="user" size="xs" className="inline mr-1 text-parchment-500" />
                                            {p.name}
                                        </div>
                                        <RolePickerGrid
                                            roles={availableRoles}
                                            state={state}
                                            selected={currentSelected}
                                            onSelect={(roleId) => handleSelectRole(playerId, roleId)}
                                            selectionCount={1}
                                            colorMode="team"
                                        />
                                    </div>
                                );
                            })}
                        </StepSection>
                    )}

                    {selectedPlayers.length === 2 && minionsInSelection.length === 0 && (
                        <AlertBox message={t.game.mustIncludeMinion} />
                    )}
                </NarratorSetupLayout>
            );
        }

        // Player View Phase
        const player1 = state.players.find((p) => p.id === selectedPlayers[0]);
        const player2 = state.players.find((p) => p.id === selectedPlayers[1]);

        if (!selectedRoleId) return null;

        const shownRole = getRole(selectedRoleId);
        const shownTeamId = shownRole?.team ?? "townsfolk";
        const shownTeam = getTeam(shownTeamId);

        return (
            <TeamBackground teamId={shownTeamId}>
                <div className={`text-center text-xs mb-4 max-w-sm mx-auto ${shownTeam.isEvil ? "text-red-300/80" : "text-parchment-300/80"}`}>
                    <p className="uppercase tracking-widest font-semibold mb-2">
                        {t.game.oneOfThemIsThe}
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {player1 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                <Icon name="user" size="xs" />
                                <span className="font-medium">{player1.name}</span>
                            </span>
                        )}
                        {player2 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                <Icon name="user" size="xs" />
                                <span className="font-medium">{player2.name}</span>
                            </span>
                        )}
                    </div>
                </div>

                <RoleCard roleId={selectedRoleId} />

                <CardLink onClick={handleComplete} isEvil={shownTeam.isEvil}>
                    {t.common.continue}
                </CardLink>
            </TeamBackground>
        );
    },
};

export default definition;
