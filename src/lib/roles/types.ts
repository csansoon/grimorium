import { GameState, PlayerState, HistoryEntry, Game } from "../types";
import { IconName } from "../../components/atoms/icon";
import { TeamId } from "../teams";
import { Intent, WinConditionCheck } from "../pipeline/types";
import { Translations } from "../i18n/types";

// ============================================================================
// EFFECT TYPES
// ============================================================================

export type EffectToAdd = {
    type: string;
    data?: Record<string, unknown>;
    expiresAt?: "end_of_night" | "end_of_day" | "never";
};

// ============================================================================
// NIGHT ACTION PROPS
// ============================================================================

export type NightActionProps = {
    game: Game;
    state: GameState;
    player: PlayerState;
    onComplete: (result: NightActionResult) => void;
};

export type NightActionResult = {
    // The events to add to history
    entries: Omit<HistoryEntry, "id" | "timestamp" | "stateAfter">[];
    // Updates to apply to the game state
    stateUpdates?: Partial<GameState>;
    // Effects to add to players (playerId -> effects to add)
    addEffects?: Record<string, EffectToAdd[]>;
    // Effects to remove from players (playerId -> effect types to remove)
    removeEffects?: Record<string, string[]>;
    // Intent to resolve through the pipeline (for action roles like Imp)
    intent?: Intent;
};

// ============================================================================
// ROLE REVEAL PROPS
// ============================================================================

export type RoleRevealProps = {
    player: PlayerState;
    onContinue: () => void;
};

// ============================================================================
// NIGHT STEPS
// ============================================================================

/**
 * Declarative metadata for a step in a role's night action flow.
 * Used by NightStepListLayout to render the step list landing page.
 */
export type NightStepDefinition = {
    id: string;
    icon: IconName;
    getLabel: (t: Translations) => string;
    /** If provided, this step is only shown when the condition returns true. */
    condition?: (game: Game, player: PlayerState, state: GameState) => boolean;
};

// ============================================================================
// SETUP ACTION PROPS
// ============================================================================

/**
 * Props for a role's pre-revelation setup action.
 * Used for roles that need narrator configuration before role revelation
 * (e.g., the Drunk choosing which Townsfolk to believe they are).
 */
export type SetupActionProps = {
    player: PlayerState;
    state: GameState;
    onComplete: (result: SetupActionResult) => void;
};

export type SetupActionResult = {
    // Change this player's roleId to a new role
    changeRole?: string;
    // Effects to add to players (playerId -> effects to add)
    addEffects?: Record<string, EffectToAdd[]>;
    // Effects to remove from players (playerId -> effect types to remove)
    removeEffects?: Record<string, string[]>;
};

// ============================================================================
// ROLE DEFINITION
// ============================================================================

export type RoleId =
    | "villager"
    | "imp"
    | "washerwoman"
    | "librarian"
    | "investigator"
    | "chef"
    | "empath"
    | "fortune_teller"
    | "undertaker"
    | "monk"
    | "ravenkeeper"
    | "soldier"
    | "virgin"
    | "slayer"
    | "mayor"
    | "saint"
    | "scarlet_woman"
    | "recluse"
    | "poisoner"
    | "drunk";

export type RoleDefinition = {
    id: RoleId;
    team: TeamId;
    icon: IconName;

    // Night order - lower numbers wake first, null means doesn't wake at night
    nightOrder: number | null;

    // Optional function to check if this role should wake this night
    // Used for: first night only, skips first night, conditional abilities, etc.
    // If not provided, the role always wakes when it's their turn
    shouldWake?: (game: Game, player: PlayerState) => boolean;

    // Effects that are applied to this player at game start
    initialEffects?: EffectToAdd[];

    // Win conditions this role contributes (checked dynamically)
    winConditions?: WinConditionCheck[];

    // Declarative list of steps for this role's night action.
    // Used by NightStepListLayout to render a step list landing page.
    // If omitted, a single default step is shown.
    nightSteps?: NightStepDefinition[];

    // Component to show when revealing role to player
    RoleReveal: React.FC<RoleRevealProps>;

    // Component for night action, null if no action needed
    NightAction: React.FC<NightActionProps> | null;

    // Optional setup action shown to the narrator AFTER role assignment
    // but BEFORE role revelation begins. Used for roles that need
    // narrator configuration (e.g., Drunk choosing believed role).
    SetupAction?: React.FC<SetupActionProps>;
};
