import { EffectDefinition } from "../types";

const definition: EffectDefinition = {
    id: "used_dead_vote",
    name: "Used Dead Vote",
    description: "This dead player has used their one dead vote and cannot vote again.",
    icon: "🗳️",

    preventsVoting: true,

    canVote: () => false,
};

export default definition;
