import { EffectDefinition } from "../types";
import { hasEffect } from "../../types";

const definition: EffectDefinition = {
    id: "dead",
    name: "Dead",
    description: "This player is dead and cannot vote or nominate (except for one final dead vote).",
    icon: "💀",

    preventsNightWake: true,
    preventsVoting: true,
    preventsNomination: true,

    // Dead players can vote once if they haven't used their dead vote
    canVote: (player) => {
        return !hasEffect(player, "used_dead_vote");
    },

    canNominate: () => false,
};

export default definition;
