import { EffectDefinition } from "../types";
import { Perception } from "../../pipeline/types";

/**
 * Spy Misregister effect — the inverse of Recluse Misregister.
 *
 * The Spy is a Minion (evil), but might register as good and as a
 * Townsfolk or Outsider to information abilities, even if dead.
 *
 * `canRegisterAs` declares what misregistration is possible, enabling
 * `getAmbiguousPlayers()` to detect the Spy without hardcoded checks.
 *
 * The perception modifier reads `effectData?.perceiveAs` so that
 * `applyPerceptionOverrides()` + `PerceptionConfigStep` work automatically.
 */
const definition: EffectDefinition = {
    id: "spy_misregister",
    icon: "eye",
    canRegisterAs: {
        teams: ["townsfolk", "outsider"],
        alignments: ["good"],
    },
    perceptionModifiers: [
        {
            context: ["alignment", "team", "role"],
            modify: (perception, _target, _observer, _state, effectData) => {
                const overrides = effectData?.perceiveAs as
                    | Partial<Perception>
                    | undefined;
                if (!overrides) return perception;
                return { ...perception, ...overrides };
            },
        },
    ],
};

export default definition;
