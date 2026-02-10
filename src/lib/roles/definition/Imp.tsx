import { useState, useMemo } from "react";
import { RoleDefinition } from "../types";
import { isAlive } from "../../types";
import { isMalfunctioning } from "../../effects";
import { useI18n } from "../../i18n";
import { getRole, getAllRoles } from "../index";
import { isGoodTeam } from "../../teams";
import { DefaultRoleReveal } from "../../../components/items/DefaultRoleReveal";
import {
    NightActionLayout,
    NarratorSetupLayout,
    NightStepListLayout,
} from "../../../components/layouts";
import type { NightStep } from "../../../components/layouts";
import { SelectablePlayerItem } from "../../../components/inputs";
import { PlayerSelector } from "../../../components/inputs";
import { StepSection, MysticDivider } from "../../../components/items";
import { Button, Icon } from "../../../components/atoms";

type Phase =
    | "step_list"
    // First night phases
    | "show_minions"
    | "select_bluffs"
    | "show_bluffs"
    // Kill phases (subsequent nights)
    | "choose_victim"
    | "select_new_imp";

/**
 * The Imp — Demon role.
 *
 * First night: The Imp is shown their Minions, the narrator selects 3 good
 * roles not in play as bluffs, and those bluffs are shown to the Imp.
 * No kill action on the first night.
 *
 * Subsequent nights: the Imp selects a target and emits a kill intent.
 * If the Imp targets themselves and there are alive Minions, the narrator
 * selects which Minion becomes the new Imp. This bypasses the pipeline
 * entirely (no kill intent emitted), so passive effects like Scarlet Woman
 * do NOT trigger — it is always the narrator's choice.
 *
 * All other effect interactions (Safe protection, Bounce redirect) are
 * handled by the pipeline through effect handlers. The Imp has zero
 * knowledge of other roles.
 */
const definition: RoleDefinition = {
    id: "imp",
    team: "demon",
    icon: "skull",
    nightOrder: 30,
    shouldWake: (_game, player) => isAlive(player),

    nightSteps: [
        {
            id: "show_minions",
            icon: "users",
            getLabel: (t) => t.game.stepShowMinions,
            condition: (_game, _player, state) => state.round === 1,
        },
        {
            id: "select_bluffs",
            icon: "shuffle",
            getLabel: (t) => t.game.stepSelectBluffs,
            condition: (_game, _player, state) => state.round === 1,
        },
        {
            id: "show_bluffs",
            icon: "eye",
            getLabel: (t) => t.game.stepShowBluffs,
            condition: (_game, _player, state) => state.round === 1,
        },
        {
            id: "choose_victim",
            icon: "skull",
            getLabel: (t) => t.game.stepChooseVictim,
            condition: (_game, _player, state) => state.round > 1,
        },
        // select_new_imp is NOT declared here — it's a dynamic runtime step
        // that only appears after the Imp selects themselves as a target.
    ],

    RoleReveal: DefaultRoleReveal,

    NightAction: ({ state, player, onComplete }) => {
        const { t } = useI18n();
        const isFirstNight = state.round === 1;

        const [phase, setPhase] = useState<Phase>("step_list");
        const [showMinionsDone, setShowMinionsDone] = useState(false);
        const [selectedBluffs, setSelectedBluffs] = useState<string[]>([]);
        const [selectBluffsDone, setSelectBluffsDone] = useState(false);
        const [selectedTarget, setSelectedTarget] = useState<string | null>(
            null,
        );
        const [chooseVictimDone, setChooseVictimDone] = useState(false);
        const [selectedNewImp, setSelectedNewImp] = useState<string | null>(
            null,
        );

        const alivePlayers = state.players.filter((p) => isAlive(p));

        const getRoleName = (roleId: string) => {
            const key = roleId as keyof typeof t.roles;
            return t.roles[key]?.name ?? roleId;
        };

        const malfunctioning = isMalfunctioning(player);

        // ================================================================
        // First Night Helpers
        // ================================================================

        // Find minion players in the game
        const minionPlayers = useMemo(
            () =>
                state.players.filter((p) => {
                    const role = getRole(p.roleId);
                    return role?.team === "minion";
                }),
            [state.players],
        );

        // Find good roles NOT in play (candidates for bluffs)
        const goodRolesNotInPlay = useMemo(() => {
            const rolesInPlay = new Set(state.players.map((p) => p.roleId));
            return getAllRoles().filter(
                (role) => isGoodTeam(role.team) && !rolesInPlay.has(role.id),
            );
        }, [state.players]);

        // ================================================================
        // Self-Kill Helpers
        // ================================================================

        // Find alive minion players (candidates for new Imp)
        const aliveMinions = useMemo(
            () =>
                state.players.filter((p) => {
                    if (!isAlive(p)) return false;
                    const role = getRole(p.roleId);
                    return role?.team === "minion";
                }),
            [state.players],
        );

        const hasAliveMinions = aliveMinions.length > 0;

        // Detect self-kill scenario: target is self, alive minions exist, not malfunctioning
        const isSelfKillConversion =
            selectedTarget === player.id && hasAliveMinions && !malfunctioning;

        // ================================================================
        // Step List
        // ================================================================

        const steps: NightStep[] = useMemo(() => {
            if (isFirstNight) {
                return [
                    {
                        id: "show_minions",
                        icon: "users",
                        label: t.game.stepShowMinions,
                        status: showMinionsDone ? "done" : "pending",
                    },
                    {
                        id: "select_bluffs",
                        icon: "shuffle",
                        label: t.game.stepSelectBluffs,
                        status: selectBluffsDone ? "done" : "pending",
                    },
                    {
                        id: "show_bluffs",
                        icon: "eye",
                        label: t.game.stepShowBluffs,
                        status: "pending",
                    },
                ];
            }

            const result: NightStep[] = [
                {
                    id: "choose_victim",
                    icon: "skull",
                    label: t.game.stepChooseVictim,
                    status: chooseVictimDone ? "done" : "pending",
                },
            ];

            // Dynamic step: appears after the Imp selects themselves as target
            if (isSelfKillConversion && chooseVictimDone) {
                result.push({
                    id: "select_new_imp",
                    icon: "sparkles",
                    label: t.game.stepSelectNewImp,
                    status: "pending",
                });
            }

            return result;
        }, [
            isFirstNight,
            showMinionsDone,
            selectBluffsDone,
            chooseVictimDone,
            isSelfKillConversion,
            t,
        ]);

        const handleSelectStep = (stepId: string) => {
            setPhase(stepId as Phase);
        };

        // ================================================================
        // First Night: Complete handler
        // ================================================================

        const handleFirstNightComplete = () => {
            const bluffNames = selectedBluffs
                .map((id) => getRoleName(id))
                .join(", ");

            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.imp.history.shownMinionsAndBluffs",
                                params: {
                                    player: player.id,
                                    bluffs: bluffNames,
                                },
                            },
                        ],
                        data: {
                            roleId: "imp",
                            playerId: player.id,
                            action: "first_night_info",
                            minionIds: minionPlayers.map((p) => p.id),
                            bluffRoleIds: selectedBluffs,
                        },
                    },
                ],
            });
        };

        // ================================================================
        // Kill confirm handler (subsequent nights)
        // ================================================================

        const handleConfirmKill = () => {
            if (!selectedTarget) return;

            const target = state.players.find(
                (p) => p.id === selectedTarget,
            );
            if (!target) return;

            // Self-kill with alive minions: mark step as done, go to step list
            // to show the "Select New Imp" step
            if (selectedTarget === player.id && hasAliveMinions && !malfunctioning) {
                setChooseVictimDone(true);
                setPhase("step_list");
                return;
            }

            // Normal kill (or self-kill with no alive minions, or malfunctioning)
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
                            ...(malfunctioning
                                ? { malfunctioned: true }
                                : {}),
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

        // ================================================================
        // Self-kill conversion: confirm new Imp
        // ================================================================

        const handleConfirmNewImp = () => {
            if (!selectedNewImp) return;

            const newImpPlayer = state.players.find(
                (p) => p.id === selectedNewImp,
            );
            if (!newImpPlayer) return;

            onComplete({
                entries: [
                    {
                        type: "night_action",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.imp.history.selfKilled",
                                params: { player: player.id },
                            },
                        ],
                        data: {
                            roleId: "imp",
                            playerId: player.id,
                            action: "self_kill",
                        },
                    },
                    {
                        type: "role_changed",
                        message: [
                            {
                                type: "i18n",
                                key: "roles.imp.history.minionBecameImp",
                                params: { player: newImpPlayer.id },
                            },
                        ],
                        data: {
                            playerId: newImpPlayer.id,
                            fromRole: newImpPlayer.roleId,
                            toRole: "imp",
                        },
                    },
                ],
                // Kill the old Imp + give the new Imp a pending role reveal
                addEffects: {
                    [player.id]: [
                        {
                            type: "dead",
                            data: { cause: "imp_self_kill" },
                            expiresAt: "never",
                        },
                    ],
                    [selectedNewImp]: [
                        {
                            type: "pending_role_reveal",
                            expiresAt: "never",
                        },
                    ],
                },
                // Change the selected Minion's role to "imp"
                changeRoles: {
                    [selectedNewImp]: "imp",
                },
                // No intent — bypasses the pipeline entirely.
                // This prevents the Scarlet Woman from auto-triggering.
            });
        };

        // ================================================================
        // Bluff toggle handler
        // ================================================================

        const handleBluffToggle = (roleId: string) => {
            setSelectedBluffs((prev) => {
                if (prev.includes(roleId)) {
                    return prev.filter((id) => id !== roleId);
                } else if (prev.length < 3) {
                    return [...prev, roleId];
                }
                return prev;
            });
        };

        // ================================================================
        // RENDER: Step List
        // ================================================================

        if (phase === "step_list") {
            return (
                <NightStepListLayout
                    icon="skull"
                    roleName={getRoleName("imp")}
                    playerName={player.name}
                    isEvil
                    steps={steps}
                    onSelectStep={handleSelectStep}
                />
            );
        }

        // ================================================================
        // RENDER: Show Minions (player-facing)
        // ================================================================

        if (phase === "show_minions") {
            return (
                <NightActionLayout
                    player={player}
                    title={t.game.demonMinionsTitle}
                    description={t.game.demonMinionsDescription}
                >
                    <div className="space-y-3 mb-6">
                        <p className="text-sm text-red-300/70 text-center font-medium mb-2">
                            {t.game.theseAreYourMinions}
                        </p>
                        {minionPlayers.map((p) => {
                            const role = getRole(p.roleId);
                            return (
                                <div
                                    key={p.id}
                                    className="p-4 rounded-lg bg-red-900/30 border border-red-700/40 flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-800/40 border border-red-600/30 flex items-center justify-center">
                                        <Icon
                                            name={role?.icon ?? "user"}
                                            size="md"
                                            className="text-red-300"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-parchment-100 font-medium">
                                            {p.name}
                                        </div>
                                        <div className="text-xs text-red-400/70">
                                            {getRoleName(p.roleId)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {minionPlayers.length === 0 && (
                            <div className="text-center p-4 text-parchment-500">
                                No Minions in play
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => {
                            setShowMinionsDone(true);
                            setPhase("step_list");
                        }}
                        fullWidth
                        size="lg"
                        variant="evil"
                    >
                        <Icon name="check" size="md" className="mr-2" />
                        {t.common.continue}
                    </Button>
                </NightActionLayout>
            );
        }

        // ================================================================
        // RENDER: Select Bluffs (narrator-facing)
        // ================================================================

        if (phase === "select_bluffs") {
            return (
                <NarratorSetupLayout
                    icon="skull"
                    roleName={getRoleName("imp")}
                    playerName={player.name}
                    onShowToPlayer={() => {
                        setSelectBluffsDone(true);
                        setPhase("step_list");
                    }}
                    showToPlayerDisabled={selectedBluffs.length !== 3}
                    showToPlayerLabel={t.common.confirm}
                >
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-amber-200">
                            {t.game.selectBluffsTitle}
                        </h3>
                        <p className="text-sm text-stone-400 mt-1">
                            {t.game.selectBluffsDescription}
                        </p>
                    </div>

                    <StepSection
                        step={1}
                        label={t.game.selectThreeBluffs}
                        count={{
                            current: selectedBluffs.length,
                            max: 3,
                        }}
                    >
                        {goodRolesNotInPlay.map((role) => {
                            const isSelected = selectedBluffs.includes(
                                role.id,
                            );
                            return (
                                <SelectablePlayerItem
                                    key={role.id}
                                    playerName={getRoleName(role.id)}
                                    roleName={
                                        t.teams[role.team]?.name ?? role.team
                                    }
                                    roleIcon={role.icon}
                                    isSelected={isSelected}
                                    isDisabled={
                                        !isSelected &&
                                        selectedBluffs.length >= 3
                                    }
                                    highlightTeam={role.team}
                                    teamLabel={
                                        t.teams[role.team]?.name ?? role.team
                                    }
                                    onClick={() =>
                                        handleBluffToggle(role.id)
                                    }
                                />
                            );
                        })}
                    </StepSection>
                </NarratorSetupLayout>
            );
        }

        // ================================================================
        // RENDER: Show Bluffs (player-facing)
        // ================================================================

        if (phase === "show_bluffs") {
            const bluffRoles = selectedBluffs
                .map((id) => getRole(id))
                .filter(Boolean);

            return (
                <NightActionLayout
                    player={player}
                    title={t.game.demonBluffsTitle}
                    description={t.game.demonBluffsDescription}
                >
                    <div className="space-y-3 mb-6">
                        <p className="text-sm text-red-300/70 text-center font-medium mb-2">
                            {t.game.theseAreYourBluffs}
                        </p>
                        {bluffRoles.map((role) => {
                            if (!role) return null;
                            return (
                                <div
                                    key={role.id}
                                    className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/40 to-blue-900/30 border border-indigo-600/30 flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-800/40 border border-indigo-500/30 flex items-center justify-center">
                                        <Icon
                                            name={role.icon}
                                            size="md"
                                            className="text-indigo-300"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-parchment-100 font-medium">
                                            {getRoleName(role.id)}
                                        </div>
                                        <div className="text-xs text-indigo-400/70">
                                            {t.teams[role.team]?.name ??
                                                role.team}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <MysticDivider />

                    <Button
                        onClick={handleFirstNightComplete}
                        fullWidth
                        size="lg"
                        variant="evil"
                        className="mt-4"
                    >
                        <Icon name="check" size="md" className="mr-2" />
                        {t.common.iUnderstandMyRole}
                    </Button>
                </NightActionLayout>
            );
        }

        // ================================================================
        // RENDER: Select New Imp (narrator-facing)
        // ================================================================

        if (phase === "select_new_imp") {
            return (
                <NarratorSetupLayout
                    icon="skull"
                    roleName={getRoleName("imp")}
                    playerName={player.name}
                    onShowToPlayer={handleConfirmNewImp}
                    showToPlayerDisabled={!selectedNewImp}
                    showToPlayerLabel={t.game.confirmNewImp}
                >
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-amber-200">
                            {t.game.selectNewImpTitle}
                        </h3>
                        <p className="text-sm text-stone-400 mt-1">
                            {t.game.selectNewImpDescription}
                        </p>
                    </div>

                    <StepSection
                        step={1}
                        label={t.game.selectMinionToBecome}
                    >
                        {aliveMinions.map((p) => {
                            const role = getRole(p.roleId);
                            const isSelected = selectedNewImp === p.id;
                            return (
                                <SelectablePlayerItem
                                    key={p.id}
                                    playerName={p.name}
                                    roleName={getRoleName(p.roleId)}
                                    roleIcon={role?.icon ?? "user"}
                                    isSelected={isSelected}
                                    isDisabled={false}
                                    highlightTeam="minion"
                                    teamLabel={t.teams.minion.name}
                                    onClick={() =>
                                        setSelectedNewImp(p.id)
                                    }
                                />
                            );
                        })}
                    </StepSection>
                </NarratorSetupLayout>
            );
        }

        // ================================================================
        // RENDER: Choose Victim (subsequent nights)
        // ================================================================

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
                    onClick={handleConfirmKill}
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
