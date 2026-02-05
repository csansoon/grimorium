import { RoleDefinition } from "../../types";
import { RoleCard } from "../../../../components/items/RoleCard";

const definition: RoleDefinition = {
    id: "slayer",
    team: "townsfolk",
    icon: "crosshair",
    nightOrder: null, // Doesn't wake at night - day ability

    // Slayer gets their bullet at game start (one-time use)
    initialEffects: [
        { type: "slayer_bullet", expiresAt: "never" },
    ],

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: null,
};

export default definition;
