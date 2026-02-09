import { EffectDefinition, EffectId } from "./types";
import Dead from "./definition/Dead";
import UsedDeadVote from "./definition/UsedDeadVote";
import Safe from "./definition/Safe";
import RedHerring from "./definition/RedHerring";
import Pure from "./definition/Pure";
import SlayerBullet from "./definition/SlayerBullet";
import Bounce from "./definition/Bounce";
import Martyrdom from "./definition/Martyrdom";
import ScarletWoman from "./definition/ScarletWoman";
import RecluseMisregister from "./definition/RecluseMisregister";
import PendingRoleReveal from "./definition/PendingRoleReveal";
import Poisoned from "./definition/Poisoned";
import Drunk from "./definition/Drunk";

export const EFFECTS: Record<EffectId, EffectDefinition> = {
    dead: Dead,
    used_dead_vote: UsedDeadVote,
    safe: Safe,
    red_herring: RedHerring,
    pure: Pure,
    slayer_bullet: SlayerBullet,
    bounce: Bounce,
    martyrdom: Martyrdom,
    scarlet_woman: ScarletWoman,
    recluse_misregister: RecluseMisregister,
    pending_role_reveal: PendingRoleReveal,
    poisoned: Poisoned,
    drunk: Drunk,
};

export function getEffect(effectId: string): EffectDefinition | undefined {
    return EFFECTS[effectId as EffectId];
}

export function getAllEffects(): EffectDefinition[] {
    return Object.values(EFFECTS);
}

/**
 * Check if a player's ability is malfunctioning due to effects
 * like Poisoned or Drunk. Uses the `poisonsAbility` flag on effect definitions.
 */
export function isMalfunctioning(player: { effects: Array<{ type: string }> }): boolean {
    return player.effects.some((e) => {
        const def = EFFECTS[e.type as EffectId];
        return def?.poisonsAbility === true;
    });
}

export * from "./types";
