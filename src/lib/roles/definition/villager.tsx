import { RoleDefinition, RoleRevealProps } from "../types";

const RoleReveal: React.FC<RoleRevealProps> = ({ player, onContinue }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 p-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">🧑‍🌾</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                    {player.name}
                </h2>
                <p className="text-blue-200 text-sm mb-6">You are the...</p>
                <h1 className="text-4xl font-bold text-blue-300 mb-4">
                    Villager
                </h1>
                <div className="bg-white/5 rounded-lg p-4 mb-8">
                    <p className="text-blue-100">
                        You have no ability. But you are still a good person!
                        Help your town find the Demon.
                    </p>
                </div>
                <button
                    onClick={onContinue}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                    I understand my role
                </button>
            </div>
        </div>
    );
};

const definition: RoleDefinition = {
    id: "villager",
    name: "Villager",
    description: "You have no ability.",
    team: "townsfolk",
    icon: "🧑‍🌾",
    nightOrder: null, // Doesn't wake at night

    RoleReveal,
    NightAction: null,
};

export default definition;
