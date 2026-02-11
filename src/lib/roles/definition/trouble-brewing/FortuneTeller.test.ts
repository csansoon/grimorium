import { describe, it, expect, beforeEach, vi } from "vitest";
import definition from "./FortuneTeller";
import { perceive } from "../../../pipeline/perception";
import { EffectDefinition, EffectId } from "../../../effects/types";
import {
    makePlayer,
    makeState,
    addEffectTo,
    makeGameWithHistory,
    resetPlayerCounter,
} from "../../../__tests__/helpers";

vi.mock("../../../effects", async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        getEffect: (effectId: string) => {
            if (testEffects[effectId]) return testEffects[effectId];
            return (actual.getEffect as (id: string) => EffectDefinition | undefined)(effectId);
        },
    };
});

const testEffects: Record<string, EffectDefinition> = {};

beforeEach(() => {
    resetPlayerCounter();
    for (const key of Object.keys(testEffects)) delete testEffects[key];
});

describe("FortuneTeller", () => {
    // ================================================================
    // SHOULD WAKE
    // ================================================================

    describe("shouldWake", () => {
        it("wakes every night when alive", () => {
            const player = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const round1 = makeGameWithHistory(
                [{ type: "night_started", data: { round: 1 }, stateOverrides: { round: 1 } }],
                makeState({ round: 1, players: [player] })
            );
            const round4 = makeGameWithHistory(
                [{ type: "night_started", data: { round: 4 }, stateOverrides: { round: 4 } }],
                makeState({ round: 4, players: [player] })
            );

            expect(definition.shouldWake!(round1, player)).toBe(true);
            expect(definition.shouldWake!(round4, player)).toBe(true);
        });

        it("does not wake when dead", () => {
            const player = addEffectTo(makePlayer({ id: "p1", roleId: "fortune_teller" }), "dead");
            const game = makeGameWithHistory(
                [{ type: "night_started", data: { round: 2 }, stateOverrides: { round: 2 } }],
                makeState({ round: 2, players: [player] })
            );
            expect(definition.shouldWake!(game, player)).toBe(false);
        });
    });

    // ================================================================
    // PERCEPTION (demon detection uses "role" context)
    // ================================================================

    describe("demon detection via perception", () => {
        it("detects actual demon through role perception", () => {
            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const imp = makePlayer({ id: "p2", roleId: "imp" });
            const state = makeState({ players: [ft, imp] });

            const perception = perceive(imp, ft, "role", state);
            expect(perception.team).toBe("demon");
        });

        it("does not detect townsfolk as demon", () => {
            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const villager = makePlayer({ id: "p2", roleId: "villager" });
            const state = makeState({ players: [ft, villager] });

            const perception = perceive(villager, ft, "role", state);
            expect(perception.team).toBe("townsfolk");
        });

        it("deceiving player registering as demon triggers false positive", () => {
            testEffects["appears_demon"] = {
                id: "appears_demon" as EffectId,
                icon: "user",
                perceptionModifiers: [{
                    context: "role",
                    modify: (p) => ({ ...p, team: "demon", roleId: "imp" }),
                }],
            };

            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const recluse = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "appears_demon"
            );
            const state = makeState({ players: [ft, recluse] });

            const perception = perceive(recluse, ft, "role", state);
            expect(perception.team).toBe("demon"); // false positive
        });

        it("demon appearing as townsfolk avoids detection", () => {
            testEffects["appears_townsfolk"] = {
                id: "appears_townsfolk" as EffectId,
                icon: "user",
                perceptionModifiers: [{
                    context: "role",
                    modify: (p) => ({ ...p, team: "townsfolk", roleId: "villager" }),
                }],
            };

            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const spy = addEffectTo(
                makePlayer({ id: "p2", roleId: "imp" }),
                "appears_townsfolk"
            );
            const state = makeState({ players: [ft, spy] });

            const perception = perceive(spy, ft, "role", state);
            expect(perception.team).toBe("townsfolk"); // false negative
        });
    });

    // ================================================================
    // NIGHT STEPS — Red Herring setup skipped when malfunctioning
    // ================================================================

    describe("nightSteps red_herring_setup condition", () => {
        const redHerringStep = definition.nightSteps!.find(
            (s) => s.id === "red_herring_setup"
        )!;

        it("shows red herring setup on night 1 when healthy", () => {
            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const state = makeState({ round: 1, players: [ft] });
            const game = makeGameWithHistory([], state);
            expect(redHerringStep.condition!(game, ft, state)).toBe(true);
        });

        it("skips red herring setup when player is malfunctioning (drunk)", () => {
            const ft = addEffectTo(
                makePlayer({ id: "p1", roleId: "fortune_teller" }),
                "drunk"
            );
            const state = makeState({ round: 1, players: [ft] });
            const game = makeGameWithHistory([], state);
            expect(redHerringStep.condition!(game, ft, state)).toBe(false);
        });

        it("skips red herring setup when player is malfunctioning (poisoned)", () => {
            const ft = addEffectTo(
                makePlayer({ id: "p1", roleId: "fortune_teller" }),
                "poisoned"
            );
            const state = makeState({ round: 1, players: [ft] });
            const game = makeGameWithHistory([], state);
            expect(redHerringStep.condition!(game, ft, state)).toBe(false);
        });

        it("skips red herring setup on subsequent nights", () => {
            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const state = makeState({ round: 2, players: [ft] });
            const game = makeGameWithHistory([], state);
            expect(redHerringStep.condition!(game, ft, state)).toBe(false);
        });

        it("skips red herring setup when already assigned", () => {
            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const herring = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "p1" }
            );
            const state = makeState({ round: 1, players: [ft, herring] });
            const game = makeGameWithHistory([], state);
            expect(redHerringStep.condition!(game, ft, state)).toBe(false);
        });
    });

    // ================================================================
    // RED HERRING (via perception — see RedHerring.test.ts for full tests)
    // ================================================================

    describe("red herring via perception", () => {
        it("red herring registers as demon to the Fortune Teller via perception", () => {
            const ft = makePlayer({ id: "p1", roleId: "fortune_teller" });
            const herring = addEffectTo(
                makePlayer({ id: "p2", roleId: "villager" }),
                "red_herring",
                { fortuneTellerId: "p1" }
            );
            const state = makeState({ players: [ft, herring] });

            const perception = perceive(herring, ft, "role", state);
            expect(perception.team).toBe("demon");
        });
    });
});
