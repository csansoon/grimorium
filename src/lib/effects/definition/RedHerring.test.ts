import { describe, it, expect, beforeEach } from "vitest";
import { perceive } from "../../pipeline/perception";
import {
    makePlayer,
    makeState,
    addEffectTo,
    resetPlayerCounter,
} from "../../__tests__/helpers";

beforeEach(() => {
    resetPlayerCounter();
});

describe("RedHerring", () => {
    describe("perception modifier", () => {
        it("registers as demon team to the assigned Fortune Teller", () => {
            const ft = makePlayer({ id: "ft1", roleId: "fortune_teller" });
            const herring = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "ft1" }
            );
            const state = makeState({ players: [ft, herring] });

            const perception = perceive(herring, ft, "role", state);
            expect(perception.team).toBe("demon");
        });

        it("does NOT register as demon to a different Fortune Teller", () => {
            const ft1 = makePlayer({ id: "ft1", roleId: "fortune_teller" });
            const ft2 = makePlayer({ id: "ft2", roleId: "fortune_teller" });
            const herring = addEffectTo(
                makePlayer({ id: "p3", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "ft1" }
            );
            const state = makeState({ players: [ft1, ft2, herring] });

            // ft1 sees demon
            expect(perceive(herring, ft1, "role", state).team).toBe("demon");
            // ft2 sees the actual team
            expect(perceive(herring, ft2, "role", state).team).toBe("townsfolk");
        });

        it("does NOT alter perception for non-Fortune Teller observers", () => {
            const empath = makePlayer({ id: "p1", roleId: "empath" });
            const herring = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "ft1" }
            );
            const state = makeState({ players: [empath, herring] });

            const perception = perceive(herring, empath, "role", state);
            expect(perception.team).toBe("townsfolk");
            expect(perception.roleId).toBe("villager");
        });

        it("preserves roleId and alignment (only modifies team)", () => {
            const ft = makePlayer({ id: "ft1", roleId: "fortune_teller" });
            const herring = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "ft1" }
            );
            const state = makeState({ players: [ft, herring] });

            const perception = perceive(herring, ft, "role", state);
            expect(perception.team).toBe("demon");
            expect(perception.roleId).toBe("villager"); // Role unchanged
            expect(perception.alignment).toBe("good"); // Alignment unchanged
        });

        it("only applies in 'role' context, not 'alignment' or 'team'", () => {
            const ft = makePlayer({ id: "ft1", roleId: "fortune_teller" });
            const herring = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "ft1" }
            );
            const state = makeState({ players: [ft, herring] });

            // "role" context triggers the modifier
            expect(perceive(herring, ft, "role", state).team).toBe("demon");
            // "alignment" context does not
            expect(perceive(herring, ft, "alignment", state).team).toBe("townsfolk");
            // "team" context does not
            expect(perceive(herring, ft, "team", state).team).toBe("townsfolk");
        });
    });
});
