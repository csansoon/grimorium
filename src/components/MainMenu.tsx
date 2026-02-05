import { getGameSummaries, getCurrentGameId, GameSummary } from "../lib/storage";

type Props = {
    onNewGame: () => void;
    onContinue: (gameId: string) => void;
    onLoadGame: (gameId: string) => void;
};

export function MainMenu({ onNewGame, onContinue, onLoadGame }: Props) {
    const games = getGameSummaries();
    const currentGameId = getCurrentGameId();
    const currentGame = games.find((g) => g.id === currentGameId);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatPhase = (game: GameSummary) => {
        if (game.phase === "ended") return "Completed";
        if (game.phase === "setup") return "Setting up";
        return `Round ${game.round} - ${game.phase}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-2">
                        🔮 Grimoire
                    </h1>
                    <p className="text-purple-200">
                        Blood on the Clocktower Narrator Companion
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Continue Current Game */}
                    {currentGame && currentGame.phase !== "ended" && (
                        <button
                            onClick={() => onContinue(currentGame.id)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition duration-300 text-left"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-lg">
                                        Continue Game
                                    </div>
                                    <div className="text-sm text-green-100 opacity-80">
                                        {currentGame.name} •{" "}
                                        {formatPhase(currentGame)}
                                    </div>
                                </div>
                                <span className="text-2xl">▶️</span>
                            </div>
                        </button>
                    )}

                    {/* New Game */}
                    <button
                        onClick={onNewGame}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition duration-300 text-left"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-lg">New Game</div>
                                <div className="text-sm text-purple-100 opacity-80">
                                    Start a fresh game
                                </div>
                            </div>
                            <span className="text-2xl">✨</span>
                        </div>
                    </button>

                    {/* Previous Games */}
                    {games.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-white text-lg font-semibold mb-3">
                                Previous Games
                            </h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {games.map((game) => (
                                    <button
                                        key={game.id}
                                        onClick={() => onLoadGame(game.id)}
                                        className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition duration-200 text-left"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium">
                                                    {game.name}
                                                </div>
                                                <div className="text-sm text-purple-200">
                                                    {game.playerCount} players •{" "}
                                                    {formatPhase(game)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-purple-300">
                                                {formatDate(game.createdAt)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
