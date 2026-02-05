import { useState } from "react";
import { GameState, hasEffect, getAlivePlayers } from "../../lib/types";
import { getRole } from "../../lib/roles";

type Props = {
    state: GameState;
    onNominate: (nominatorId: string, nomineeId: string) => void;
    onEndDay: () => void;
};

export function DayPhase({ state, onNominate, onEndDay }: Props) {
    const [nominator, setNominator] = useState<string | null>(null);
    const [nominee, setNominee] = useState<string | null>(null);

    const alivePlayers = getAlivePlayers(state);

    const handleNominate = () => {
        if (nominator && nominee) {
            onNominate(nominator, nominee);
            setNominator(null);
            setNominee(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-600 to-orange-700 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">☀️</div>
                    <h1 className="text-2xl font-bold text-white">
                        Day {state.round}
                    </h1>
                    <p className="text-yellow-100">
                        Discussion and nominations
                    </p>
                </div>

                {/* Player Status */}
                <div className="bg-white/10 rounded-xl p-4 mb-6">
                    <h2 className="text-white font-semibold mb-3">Players</h2>
                    <div className="space-y-2">
                        {state.players.map((player) => {
                            const role = getRole(player.roleId);
                            const isDead = hasEffect(player, "dead");

                            return (
                                <div
                                    key={player.id}
                                    className={`flex items-center justify-between p-2 rounded-lg ${
                                        isDead
                                            ? "bg-gray-800/50 text-gray-400"
                                            : "bg-white/10 text-white"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {isDead && <span>💀</span>}
                                        {player.name}
                                    </span>
                                    <span className="text-sm opacity-70">
                                        {role?.icon}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Nomination Section */}
                <div className="bg-white/10 rounded-xl p-4 mb-6">
                    <h2 className="text-white font-semibold mb-3">
                        New Nomination
                    </h2>

                    <div className="space-y-4">
                        {/* Nominator */}
                        <div>
                            <label className="text-yellow-100 text-sm block mb-1">
                                Who is nominating?
                            </label>
                            <select
                                value={nominator ?? ""}
                                onChange={(e) =>
                                    setNominator(e.target.value || null)
                                }
                                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                            >
                                <option value="" className="bg-gray-800">
                                    Select nominator...
                                </option>
                                {alivePlayers.map((p) => (
                                    <option
                                        key={p.id}
                                        value={p.id}
                                        className="bg-gray-800"
                                    >
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Nominee */}
                        <div>
                            <label className="text-yellow-100 text-sm block mb-1">
                                Who are they nominating?
                            </label>
                            <select
                                value={nominee ?? ""}
                                onChange={(e) =>
                                    setNominee(e.target.value || null)
                                }
                                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                            >
                                <option value="" className="bg-gray-800">
                                    Select nominee...
                                </option>
                                {alivePlayers
                                    .filter((p) => p.id !== nominator)
                                    .map((p) => (
                                        <option
                                            key={p.id}
                                            value={p.id}
                                            className="bg-gray-800"
                                        >
                                            {p.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <button
                            onClick={handleNominate}
                            disabled={!nominator || !nominee}
                            className={`w-full font-bold py-3 px-4 rounded-lg transition ${
                                nominator && nominee
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            Start Nomination
                        </button>
                    </div>
                </div>

                {/* End Day Button */}
                <button
                    onClick={onEndDay}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition duration-300"
                >
                    End Day → Go to Night 🌙
                </button>
            </div>
        </div>
    );
}
