import { useState } from "react";

type Props = {
    onNext: (players: string[]) => void;
    onBack: () => void;
};

export function PlayerEntry({ onNext, onBack }: Props) {
    const [players, setPlayers] = useState<string[]>([""]);

    const addPlayer = () => {
        setPlayers([...players, ""]);
    };

    const updatePlayer = (index: number, name: string) => {
        const updated = [...players];
        updated[index] = name;
        setPlayers(updated);
    };

    const removePlayer = (index: number) => {
        if (players.length <= 1) return;
        setPlayers(players.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        const validPlayers = players.filter((name) => name.trim().length > 0);
        if (validPlayers.length >= 2) {
            onNext(validPlayers);
        }
    };

    const validCount = players.filter((name) => name.trim().length > 0).length;
    const canProceed = validCount >= 2;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="text-white hover:text-purple-200 transition"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            New Game
                        </h1>
                        <p className="text-purple-200 text-sm">
                            Step 1: Add players
                        </p>
                    </div>
                </div>

                {/* Player List */}
                <div className="space-y-3 mb-6">
                    {players.map((player, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={player}
                                onChange={(e) =>
                                    updatePlayer(index, e.target.value)
                                }
                                placeholder={`Player ${index + 1}`}
                                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-purple-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {players.length > 1 && (
                                <button
                                    onClick={() => removePlayer(index)}
                                    className="px-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Player Button */}
                <button
                    onClick={addPlayer}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition mb-8 border border-dashed border-white/30"
                >
                    + Add Player
                </button>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`w-full font-bold py-4 px-6 rounded-xl transition duration-300 ${
                        canProceed
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    Next: Select Roles ({validCount} players)
                </button>
            </div>
        </div>
    );
}
