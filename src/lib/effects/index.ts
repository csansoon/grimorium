import { EffectDefinition, EffectId } from "./types";
import Dead from "./definition/Dead";
import UsedDeadVote from "./definition/UsedDeadVote";
import Safe from "./definition/Safe";
import RedHerring from "./definition/RedHerring";
import Pure from "./definition/pure";

export const EFFECTS: Record<EffectId, EffectDefinition> = {
    dead: Dead,
    used_dead_vote: UsedDeadVote,
    safe: Safe,
    red_herring: RedHerring,
    pure: Pure,
};

export function getEffect(effectId: string): EffectDefinition | undefined {
    return EFFECTS[effectId as EffectId];
}

export * from "./types";
