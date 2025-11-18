import { GameState } from "../game";

export type EffectScript = (gameState: GameState) => void;
export type IconGenerator = (gameState: GameState) => string;

export type EffectDefinition = {
    name: string;
    description: string;
    script: EffectScript;
    icon: IconGenerator;
};
