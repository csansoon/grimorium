import { useMemo } from "react";
import { Game, GameState, PlayerState } from "../../lib/types";
import { getRole } from "../../lib/roles";
import { useI18n } from "../../lib/i18n";
import { Button, Icon } from "../atoms";
import { ScreenFooter } from "../layouts/ScreenFooter";
import { cn } from "../../lib/utils";

type Props = {
    game: Game;
    state: GameState;
    onOpenSetupAction: (playerId: string, roleId: string) => void;
    onContinue: () => void;
    onShowRoleCard: (player: PlayerState) => void;
    onEditEffects: (player: PlayerState) => void;
};

type SetupActionItem = {
    playerId: string;
    playerName: string;
    roleId: string;
    roleName: string;
    roleIcon: string;
    isDone: boolean;
};

export function SetupActionsScreen({
    game,
    state,
    onOpenSetupAction,
    onContinue,
}: Props) {
    const { t } = useI18n();

    const completedSetupPlayerIds = useMemo(
        () =>
            new Set(
                game.history
                    .filter((e) => e.type === "setup_action")
                    .map((e) => e.data.playerId as string),
            ),
        [game.history],
    );

    const setupItems = useMemo(() => {
        const items: SetupActionItem[] = [];

        for (const player of state.players) {
            const role = getRole(player.roleId);
            if (!role?.SetupAction) continue;
            if (completedSetupPlayerIds.has(player.id)) continue;

            const key = player.roleId as keyof typeof t.roles;
            items.push({
                playerId: player.id,
                playerName: player.name,
                roleId: player.roleId,
                roleName: t.roles[key]?.name ?? player.roleId,
                roleIcon: role.icon,
                isDone: false,
            });
        }

        return items;
    }, [state.players, completedSetupPlayerIds, t]);

    const allDone = setupItems.length === 0;

    return (
        <div className="min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-b from-mystic-gold/10 to-transparent px-4 py-4">
                <div className="max-w-lg mx-auto">
                    <div className="text-center">
                        <div className="flex justify-center mb-2">
                            <Icon
                                name="sparkles"
                                size="3xl"
                                className="text-mystic-gold text-glow-gold"
                            />
                        </div>
                        <h1 className="font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase">
                            {t.game.setupActions}
                        </h1>
                        <p className="text-parchment-400 text-sm">
                            {t.game.setupActionsSubtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Setup Action List */}
            <div className="flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto">
                <div className="space-y-2">
                    {setupItems.map((item) => (
                        <button
                            key={item.playerId}
                            onClick={() =>
                                onOpenSetupAction(item.playerId, item.roleId)
                            }
                            className={cn(
                                "w-full flex items-center gap-3 p-4 rounded-lg transition-colors text-left group",
                                "bg-amber-900/10 hover:bg-amber-900/20 border border-amber-700/30 hover:border-amber-600/50",
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0">
                                <Icon
                                    name={item.roleIcon}
                                    size="md"
                                    className="text-amber-400"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-parchment-100">
                                    {item.playerName}
                                </div>
                                <span className="text-xs text-amber-400">
                                    {item.roleName}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300">
                                <Icon name="sparkles" size="md" />
                            </div>
                        </button>
                    ))}

                    {allDone && (
                        <div className="text-center py-8">
                            <Icon
                                name="checkCircle"
                                size="xl"
                                className="text-emerald-500 mx-auto mb-2"
                            />
                            <p className="text-parchment-400 text-sm">
                                All setup actions complete
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <ScreenFooter>
                <Button
                    onClick={onContinue}
                    disabled={!allDone}
                    fullWidth
                    size="lg"
                    variant="dawn"
                >
                    <Icon name="eye" size="md" className="mr-2" />
                    {t.game.continueToRoleRevelation}
                </Button>
            </ScreenFooter>
        </div>
    );
}
