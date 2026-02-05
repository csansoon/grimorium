import { useState } from "react";
import { RoleDefinition, RoleRevealProps, NightActionProps } from "../types";
import { isAlive } from "../../types";

const RoleReveal: React.FC<RoleRevealProps> = ({ player, onContinue }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-900 to-black p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">😈</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                    {player.name}
                </h2>
                <p className="text-red-200 text-sm mb-6">You are the...</p>
                <h1 className="text-4xl font-bold text-red-400 mb-4">Imp</h1>
                <div className="bg-white/5 rounded-lg p-4 mb-8">
                    <p className="text-red-100">
                        Each night*, choose a player: they die. If you kill
                        yourself, a Minion becomes the Imp.
                    </p>
                    <p className="text-red-300 text-sm mt-2">
                        * You do not act on the first night.
                    </p>
                </div>
                <button
                    onClick={onContinue}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                    I understand my role
                </button>
            </div>
        </div>
    );
};

const NightAction: React.FC<NightActionProps> = ({
    state,
    player,
    onComplete,
}) => {
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

    const alivePlayers = state.players.filter(
        (p) => isAlive(p) && p.id !== player.id
    );

    const handleConfirm = () => {
        if (!selectedTarget) return;

        const target = state.players.find((p) => p.id === selectedTarget);
        if (!target) return;

        onComplete({
            entries: [
                {
                    type: "night_action",
                    message: [
                        { type: "player", playerId: player.id },
                        { type: "text", content: " (" },
                        { type: "role", roleId: "imp" },
                        { type: "text", content: ") chose to kill " },
                        { type: "player", playerId: target.id },
                    ],
                    data: {
                        roleId: "imp",
                        playerId: player.id,
                        action: "kill",
                        targetId: target.id,
                    },
                },
            ],
            addEffects: {
                [target.id]: [{ type: "dead", data: { cause: "imp" } }],
            },
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-900 to-black p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">😈</div>
                    <h2 className="text-2xl font-bold text-white">
                        {player.name}
                    </h2>
                    <p className="text-red-300">Imp</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <p className="text-red-100 text-center">
                        Choose a player to kill tonight.
                    </p>
                </div>

                <div className="space-y-2 mb-6">
                    {alivePlayers.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedTarget(p.id)}
                            className={`w-full p-3 rounded-lg text-left transition duration-200 ${
                                selectedTarget === p.id
                                    ? "bg-red-600 text-white"
                                    : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!selectedTarget}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition duration-300 ${
                        selectedTarget
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    Confirm Kill
                </button>
            </div>
        </div>
    );
};

const definition: RoleDefinition = {
    id: "imp",
    name: "Imp",
    description:
        "Each night*, choose a player: they die. If you kill yourself, a Minion becomes the Imp.",
    team: "demon",
    icon: "😈",
    nightOrder: 50,
    skipsFirstNight: true, // Imp doesn't act on night 1

    RoleReveal,
    NightAction,
};

export default definition;
