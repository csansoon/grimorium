import { GameState } from "../../lib/types";
import { getRole } from "../../lib/roles";

type Props = {
    state: GameState;
    onMainMenu: () => void;
};

export function GameOver({ state, onMainMenu }: Props) {
    const winner = state.winner;
    const isGoodWin = winner === "townsfolk";

    return (
        <div
            className={`min-h-screen flex items-center justify-center p-6 ${
                isGoodWin
                    ? "bg-gradient-to-br from-blue-600 to-indigo-800"
                    : "bg-gradient-to-br from-red-800 to-black"
            }`}
        >
            <div className="text-center max-w-md">
                <div className="text-8xl mb-6">
                    {isGoodWin ? "🎉" : "😈"}
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                    {isGoodWin ? "Good Wins!" : "Evil Wins!"}
                </h1>
                <p className="text-xl text-white/80 mb-8">
                    {isGoodWin
                        ? "The town has vanquished the Demon!"
                        : "The Demon has conquered the town!"}
                </p>

                {/* Final Player Status */}
                <div className="bg-white/10 rounded-xl p-4 mb-8">
                    <h2 className="text-white font-semibold mb-3">
                        Final Roles
                    </h2>
                    <div className="space-y-2 text-left">
                        {state.players.map((player) => {
                            const role = getRole(player.roleId);
                            const isDead = player.effects.some(
                                (e) => e.type === "dead"
                            );

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
                                    <span className="flex items-center gap-1">
                                        {role?.icon} {role?.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={onMainMenu}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-6 rounded-xl transition duration-300"
                >
                    Back to Main Menu
                </button>
            </div>
        </div>
    );
}
