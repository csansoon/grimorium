import { EffectDefinition } from "./types";
import Dead from "./definition/dead";
import UsedDeadVote from "./definition/used-dead-vote";

export const EFFECTS: Record<string, EffectDefinition> = {
    dead: Dead,
    used_dead_vote: UsedDeadVote,
};

export function getEffect(effectId: string): EffectDefinition | undefined {
    return EFFECTS[effectId];
}

export * from "./types";
