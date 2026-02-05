import { Game, getCurrentState } from "../../lib/types";
import { RichMessage } from "../RichMessage";

type Props = {
    game: Game;
    onClose: () => void;
};

export function HistoryView({ game, onClose }: Props) {
    const state = getCurrentState(game);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case "game_created":
                return "🎮";
            case "night_started":
                return "🌙";
            case "role_revealed":
                return "👁️";
            case "night_action":
                return "⚔️";
            case "night_skipped":
                return "💤";
            case "night_resolved":
                return "☀️";
            case "day_started":
                return "☀️";
            case "nomination":
                return "👆";
            case "vote":
                return "🗳️";
            case "execution":
                return "⚰️";
            case "effect_added":
                return "✨";
            case "effect_removed":
                return "❌";
            case "game_ended":
                return "🏆";
            default:
                return "📝";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">
                        Game History
                    </h1>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 transition"
                    >
                        ✕ Close
                    </button>
                </div>

                {/* History Entries */}
                <div className="space-y-2">
                    {game.history.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-white/10 rounded-lg p-3"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">
                                    {getEventIcon(entry.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white">
                                        <RichMessage
                                            message={entry.message}
                                            state={state}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {formatTime(entry.timestamp)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
