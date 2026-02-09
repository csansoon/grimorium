import { it, expect } from "vitest";
import definition from "./Drunk";

// The Drunk's ability malfunction behavior is tested in Drunk.test.ts (effects).
// The Drunk's unconditional perception modifier is also tested there.
// The SetupAction component is UI-based and tested via the component.

it("Drunk has no NightAction (acts as the believed role)", () => {
    expect(definition.NightAction).toBeNull();
});

it("Drunk has no nightOrder (never wakes as Drunk)", () => {
    expect(definition.nightOrder).toBeNull();
});

it("Drunk is an outsider", () => {
    expect(definition.team).toBe("outsider");
});

it("Drunk has a SetupAction for choosing believed role", () => {
    expect(definition.SetupAction).toBeDefined();
});
