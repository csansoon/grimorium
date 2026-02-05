// ============================================================================
// CORE TYPES
// ============================================================================

export type Team = "townsfolk" | "outsider" | "minion" | "demon";

export type Phase = "setup" | "night" | "day" | "voting" | "ended";

// ============================================================================
// EFFECTS
// ============================================================================

export type EffectInstance = {
    id: string;
    type: string;
    data?: Record<string, unknown>;
    sourcePlayerId?: string;
    expiresAt?: "end_of_night" | "end_of_day" | "never";
};

// ============================================================================
// PLAYERS
// ============================================================================

export type PlayerState = {
    id: string;
    name: string;
    roleId: string;
    effects: EffectInstance[];
};

// ============================================================================
// GAME STATE
// ============================================================================

export type GameState = {
    phase: Phase;
    round: number; // 0 = setup, 1+ = actual rounds
    players: PlayerState[];
    winner: Team | null;
};

// ============================================================================
// RICH MESSAGES
// ============================================================================

export type MessagePart =
    | { type: "text"; content: string }
    | { type: "player"; playerId: string }
    | { type: "role"; roleId: string }
    | { type: "effect"; effectType: string };

export type RichMessage = MessagePart[];

// ============================================================================
// HISTORY
// ============================================================================

export type EventType =
    | "game_created"
    | "night_started"
    | "role_revealed"
    | "night_action"
    | "night_skipped"
    | "night_resolved"
    | "day_started"
    | "nomination"
    | "vote"
    | "execution"
    | "effect_added"
    | "effect_removed"
    | "game_ended";

export type HistoryEntry = {
    id: string;
    timestamp: number;
    type: EventType;
    message: RichMessage;
    data: Record<string, unknown>;
    stateAfter: GameState;
};

// ============================================================================
// GAME
// ============================================================================

export type Game = {
    id: string;
    name: string;
    createdAt: number;
    history: HistoryEntry[];
};

// ============================================================================
// HELPERS
// ============================================================================

export function getCurrentState(game: Game): GameState {
    const lastEntry = game.history.at(-1);
    if (!lastEntry) {
        return createInitialState();
    }
    return lastEntry.stateAfter;
}

export function createInitialState(): GameState {
    return {
        phase: "setup",
        round: 0,
        players: [],
        winner: null,
    };
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

// ============================================================================
// PLAYER HELPERS
// ============================================================================

export function getPlayer(
    state: GameState,
    playerId: string
): PlayerState | undefined {
    return state.players.find((p) => p.id === playerId);
}

export function hasEffect(player: PlayerState, effectType: string): boolean {
    return player.effects.some((e) => e.type === effectType);
}

export function isAlive(player: PlayerState): boolean {
    return !hasEffect(player, "dead");
}

export function getAlivePlayers(state: GameState): PlayerState[] {
    return state.players.filter(isAlive);
}

export function getDeadPlayers(state: GameState): PlayerState[] {
    return state.players.filter((p) => !isAlive(p));
}
