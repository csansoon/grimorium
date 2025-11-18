import { Effect } from "./effects";
import { Role } from "./roles";

export type Player = {
    name: string;
    role: Role;
};

type PlayerName = Player["name"];

export type PlayerState = {
    effects: Effect[];
    data: Record<string, any>; // This will be a generic type depending on the player's role
};

export type GameState = {
    players: Map<PlayerName, PlayerState>;
};

export type Turn = {
    message: string; // For now it will be a single string
    state: GameState; // Game state AFTER the turn has been completed
};

export type Round = {
    turns: Turn[];
    votes: Vote[];
    completed: boolean; // TODO: this may not be needed
};

export type Game = {
    players: Player[];
    rounds: Round[];
};
