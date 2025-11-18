import { GameState } from "../game";

export type RoleScript = (gameState: GameState) => void;
export type IconGenerator = (gameState: GameState) => string;

export type RoleDefinition = {
    name: string;
    description: string;
    script: RoleScript;
    icon: IconGenerator;
};
