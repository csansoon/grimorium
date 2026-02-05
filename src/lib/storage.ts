import { Game } from "./types";

const STORAGE_KEY = "grimoire_games";
const CURRENT_GAME_KEY = "grimoire_current_game";

// ============================================================================
// GAME STORAGE
// ============================================================================

export function saveGame(game: Game): void {
    const games = getAllGames();
    const existingIndex = games.findIndex((g) => g.id === game.id);

    if (existingIndex >= 0) {
        games[existingIndex] = game;
    } else {
        games.push(game);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function getAllGames(): Game[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    try {
        return JSON.parse(data) as Game[];
    } catch {
        return [];
    }
}

export function getGame(gameId: string): Game | undefined {
    const games = getAllGames();
    return games.find((g) => g.id === gameId);
}

export function deleteGame(gameId: string): void {
    const games = getAllGames().filter((g) => g.id !== gameId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));

    // Clear current game if it was deleted
    if (getCurrentGameId() === gameId) {
        clearCurrentGame();
    }
}

// ============================================================================
// CURRENT GAME
// ============================================================================

export function setCurrentGameId(gameId: string): void {
    localStorage.setItem(CURRENT_GAME_KEY, gameId);
}

export function getCurrentGameId(): string | null {
    return localStorage.getItem(CURRENT_GAME_KEY);
}

export function clearCurrentGame(): void {
    localStorage.removeItem(CURRENT_GAME_KEY);
}

export function getCurrentGame(): Game | undefined {
    const gameId = getCurrentGameId();
    if (!gameId) return undefined;
    return getGame(gameId);
}

// ============================================================================
// GAME LIST HELPERS
// ============================================================================

export type GameSummary = {
    id: string;
    name: string;
    createdAt: number;
    playerCount: number;
    phase: string;
    round: number;
};

export function getGameSummaries(): GameSummary[] {
    const games = getAllGames();

    return games
        .map((game) => {
            const lastEntry = game.history.at(-1);
            const state = lastEntry?.stateAfter;

            return {
                id: game.id,
                name: game.name,
                createdAt: game.createdAt,
                playerCount: state?.players.length ?? 0,
                phase: state?.phase ?? "unknown",
                round: state?.round ?? 0,
            };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
}
