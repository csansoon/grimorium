import { RichMessage as RichMessageType, GameState, getPlayer } from "../lib/types";
import { getRole } from "../lib/roles";

type Props = {
    message: RichMessageType;
    state: GameState;
};

export function RichMessage({ message, state }: Props) {
    return (
        <span>
            {message.map((part, index) => {
                switch (part.type) {
                    case "text":
                        return <span key={index}>{part.content}</span>;

                    case "player": {
                        const player = getPlayer(state, part.playerId);
                        if (!player) return <span key={index}>[Unknown Player]</span>;
                        return (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                                {player.name}
                            </span>
                        );
                    }

                    case "role": {
                        const role = getRole(part.roleId);
                        if (!role) return <span key={index}>[Unknown Role]</span>;
                        return (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                            >
                                {role.icon} {role.name}
                            </span>
                        );
                    }

                    case "effect": {
                        return (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                            >
                                {part.effectType}
                            </span>
                        );
                    }

                    default:
                        return null;
                }
            })}
        </span>
    );
}
