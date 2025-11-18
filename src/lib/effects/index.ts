import { EffectDefinition } from "./types";

import DeadEffect from "./definition/dead";

export enum Effect {
    Dead,
}

export const EFFECTS: Record<Effect, EffectDefinition> = {
    [Effect.Dead]: DeadEffect,
};
