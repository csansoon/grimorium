import { EffectDefinition } from "../types";

const definition: EffectDefinition = {
    id: "red_herring",
    icon: "fish",
    perceptionModifiers: [
        {
            context: "role",
            observerRoles: ["fortune_teller"],
            modify: (perception, _target, observer, _state, effectData) => {
                // Only affect the specific Fortune Teller this Red Herring was assigned to
                if (effectData?.fortuneTellerId !== observer.id) return perception;
                return { ...perception, team: "demon" };
            },
        },
    ],
};

export default definition;
