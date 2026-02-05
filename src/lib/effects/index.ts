import { EffectDefinition, EffectId } from "./types";
import Dead from "./definition/dead";
import UsedDeadVote from "./definition/used-dead-vote";

export const EFFECTS: Record<EffectId, EffectDefinition> = {
    dead: Dead,
    used_dead_vote: UsedDeadVote,
};

export function getEffect(effectId: string): EffectDefinition | undefined {
    return EFFECTS[effectId as EffectId];
}

export * from "./types";
