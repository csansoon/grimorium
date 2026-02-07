import { RoleDefinition } from "../../types";
import { RoleCard } from "../../../../components/items/RoleCard";

/**
 * The Recluse — Outsider role.
 *
 * Passive ability: "You might register as evil & as a Minion or Demon, even if dead."
 *
 * The Recluse has no night action. Instead, whenever another role's ability
 * reads the Recluse's alignment or role type, the Narrator is prompted to
 * decide what the Recluse registers as (own role, Minion, or Demon).
 *
 * This is handled in each information-gathering role's NightAction component.
 */
const definition: RoleDefinition = {
    id: "recluse",
    team: "outsider",
    icon: "flowerLotus",
    nightOrder: null, // Doesn't wake at night — passive ability

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: null,
};

export default definition;
