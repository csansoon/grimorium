import { EffectDefinition } from "../types";

/**
 * Drunk effect — permanently causes the player's ability to malfunction.
 *
 * The Drunk is an Outsider who believes they are a Townsfolk. At game setup,
 * the narrator chooses which Townsfolk role the Drunk believes they are.
 * The Drunk's `roleId` is then changed to that Townsfolk role, and this
 * effect is applied permanently.
 *
 * The unconditional perception modifier ensures that any role checking this
 * player's identity (Undertaker, Ravenkeeper, Washerwoman, etc.) sees "Drunk"
 * and "Outsider" instead of the believed Townsfolk role.
 *
 * Unlike Recluse's `canRegisterAs`, this does NOT declare `canRegisterAs`
 * because the misregistration is unconditional — no narrator configuration
 * step should be triggered by `getAmbiguousPlayers()`.
 *
 * Instance data: `{ actualRole: "drunk" }` — preserves the ground truth.
 */
const definition: EffectDefinition = {
    id: "drunk",
    icon: "beer",
    poisonsAbility: true,
    perceptionModifiers: [
        {
            context: ["role", "team"],
            modify: (perception) => ({
                ...perception,
                roleId: "drunk",
                team: "outsider",
            }),
        },
    ],
};

export default definition;
