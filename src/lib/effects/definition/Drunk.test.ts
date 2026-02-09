import { describe, it, expect, beforeEach } from "vitest";
import definition from "./Drunk";
import { perceive } from "../../pipeline";
import {
    makePlayer,
    makeState,
    addEffectTo,
    resetPlayerCounter,
} from "../../__tests__/helpers";

beforeEach(() => resetPlayerCounter());

describe("Drunk effect", () => {
    it("has poisonsAbility set to true", () => {
        expect(definition.poisonsAbility).toBe(true);
    });

    it("has no handlers", () => {
        expect(definition.handlers).toBeUndefined();
    });

    it("has no canRegisterAs (unconditional perception, no narrator config)", () => {
        expect(definition.canRegisterAs).toBeUndefined();
    });

    // ================================================================
    // PERCEPTION MODIFIER
    // ================================================================

    describe("perception modifier", () => {
        it("has perception modifiers for role and team contexts", () => {
            expect(definition.perceptionModifiers).toBeDefined();
            expect(definition.perceptionModifiers).toHaveLength(1);
            const modifier = definition.perceptionModifiers![0];
            expect(modifier.context).toContain("role");
            expect(modifier.context).toContain("team");
        });

        it("makes the player perceive as Drunk role", () => {
            // Player is a Chef with the Drunk effect (believes they are Chef)
            const drunkPlayer = addEffectTo(
                makePlayer({ id: "p1", roleId: "chef" }),
                "drunk",
                { actualRole: "drunk" }
            );
            const observer = makePlayer({ id: "p2", roleId: "washerwoman" });
            const state = makeState({ players: [drunkPlayer, observer] });

            const perception = perceive(drunkPlayer, observer, "role", state);
            expect(perception.roleId).toBe("drunk");
            expect(perception.team).toBe("outsider");
        });

        it("makes the player perceive as Outsider team", () => {
            const drunkPlayer = addEffectTo(
                makePlayer({ id: "p1", roleId: "empath" }),
                "drunk",
                { actualRole: "drunk" }
            );
            const observer = makePlayer({ id: "p2", roleId: "investigator" });
            const state = makeState({ players: [drunkPlayer, observer] });

            const perception = perceive(drunkPlayer, observer, "team", state);
            expect(perception.team).toBe("outsider");
        });

        it("does not affect alignment perception (Drunk is still good)", () => {
            const drunkPlayer = addEffectTo(
                makePlayer({ id: "p1", roleId: "chef" }),
                "drunk",
                { actualRole: "drunk" }
            );
            const observer = makePlayer({ id: "p2", roleId: "chef" });
            const state = makeState({ players: [drunkPlayer, observer] });

            const perception = perceive(drunkPlayer, observer, "alignment", state);
            // Alignment should stay based on the actual roleId (chef = townsfolk = good)
            expect(perception.alignment).toBe("good");
        });
    });
});
