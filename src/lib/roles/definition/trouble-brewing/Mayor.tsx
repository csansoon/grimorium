import { RoleDefinition } from "../../types";
import { RoleCard } from "../../../../components/items/RoleCard";

const definition: RoleDefinition = {
    id: "mayor",
    team: "townsfolk",
    icon: "landmark",
    nightOrder: null, // Doesn't wake at night — passive ability

    // Mayor gets Bounce effect at game start (redirects Demon kills)
    initialEffects: [
        { type: "bounce", expiresAt: "never" },
    ],

    RoleReveal: ({ player, onContinue }) => (
        <RoleCard player={player} onContinue={onContinue} />
    ),

    NightAction: null,
};

export default definition;
