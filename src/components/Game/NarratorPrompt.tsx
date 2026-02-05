import { PlayerState } from "../../lib/types";
import { getRole } from "../../lib/roles";

type Props = {
    player: PlayerState;
    action: "role_reveal" | "night_action";
    onProceed: () => void;
};

export function NarratorPrompt({ player, action, onProceed }: Props) {
    const role = getRole(player.roleId);

    const getMessage = () => {
        if (action === "role_reveal") {
            return `Give the device to ${player.name} so they can see their role.`;
        }
        return `Wake ${player.name} (${role?.name ?? "Unknown"}) for their night action.`;
    };

    const getIcon = () => {
        if (action === "role_reveal") {
            return "👁️";
        }
        return role?.icon ?? "🌙";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-6">{getIcon()}</div>
                <h2 className="text-xl text-gray-300 mb-2">Narrator</h2>
                <p className="text-2xl font-bold text-white mb-8">
                    {getMessage()}
                </p>
                <button
                    onClick={onProceed}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition duration-300"
                >
                    Ready - Show to Player
                </button>
            </div>
        </div>
    );
}
