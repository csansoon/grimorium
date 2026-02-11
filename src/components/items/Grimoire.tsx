import { useMemo, useState } from "react";
import { GameState, PlayerState, hasEffect } from "../../lib/types";
import { getRole } from "../../lib/roles";
import { getTeam } from "../../lib/teams";
import { useI18n } from "../../lib/i18n";
import { Icon, Badge, IconName } from "../atoms";
import { PlayerDetailModal } from "./PlayerDetailModal";
import { PlayerRoleIcon, filterVisibleEffects } from "./PlayerRoleIcon";
import { cn } from "../../lib/utils";
import { getEffect } from "../../lib/effects";

type Props = {
    state: GameState;
    compact?: boolean;
    onShowRoleCard?: (player: PlayerState) => void;
    onEditEffects?: (player: PlayerState) => void;
};

function PlayerRow({ player, onClick }: { player: PlayerState; onClick: () => void }) {
    const role = getRole(player.roleId);
    const team = role ? getTeam(role.team) : null;
    const isDead = hasEffect(player, "dead");

    const { t } = useI18n();

    const roleName = useMemo(() => {
        const key = player.roleId as keyof typeof t.roles;
        return t.roles[key]?.name ?? player.roleId;
    }, [player.roleId, t.roles]);

    const effectIcons = useMemo<IconName[]>(() => {
        return filterVisibleEffects(player.effects).map(e => {
            const effect = getEffect(e.type);
            return effect ? effect.icon : "x";
        });
    }, [player.effects]);

    return (
        <button
            key={player.id}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                "hover:bg-white/5 active:bg-white/10",
                isDead ? "opacity-60" : ""
            )}
        >
            <PlayerRoleIcon player={player} size="md" />

            {/* Player Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "font-medium text-sm",
                        isDead ? "text-parchment-500 line-through" : "text-parchment-100"
                    )}>
                        {player.name}
                    </div>
                    {effectIcons.map(icon => (
                        <Badge variant='effect' className="px-1">
                            <Icon name={icon} size="xs" />
                        </Badge>
                    ))}
                </div>
                {role && (
                    <span className={cn("text-xs", team?.colors.text)}>
                        {roleName}
                    </span>
                )}
            </div>

            {/* Arrow */}
            <Icon name="arrowRight" size="sm" className="text-parchment-500" />
        </button>
    );
}

export function Grimoire({ state, compact = false, onShowRoleCard, onEditEffects }: Props) {
    
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerState | null>(null);

    

    return (
        <>
            <div className={cn("space-y-1", compact ? "" : "")}>
                {state.players.map((player) => 
                    <PlayerRow key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
                )}
            </div>

            {/* Player Detail Modal */}
            <PlayerDetailModal
                player={selectedPlayer}
                open={selectedPlayer !== null}
                onClose={() => setSelectedPlayer(null)}
                onShowRoleCard={onShowRoleCard}
                onEditEffects={onEditEffects}
            />
        </>
    );
}
