import { RoleDefinition } from "../../types";
import { DefaultRoleReveal } from "../../../../components/items/DefaultRoleReveal";

/**
 * Baron — Minion role.
 *
 * There are extra Outsiders in play. [+2 Outsiders]
 *
 * The Baron's ability only affects the game setup — when the Baron is
 * in play, the narrator should include 2 extra Outsiders (replacing
 * 2 Townsfolk) in the role distribution.
 *
 * This is a purely passive role with no night action and no effects.
 */
const definition: RoleDefinition = {
    id: "baron",
    team: "minion",
    icon: "crown",
    nightOrder: null, // Doesn't wake at night — passive ability

    RoleReveal: DefaultRoleReveal,

    NightAction: null,
};

export default definition;
