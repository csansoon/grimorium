import { useState } from "react";
import { getAllRoles } from "../../lib/roles";
import { RoleDefinition } from "../../lib/roles/types";

type Props = {
    players: string[];
    onNext: (selectedRoles: string[]) => void;
    onBack: () => void;
};

export function RoleSelection({ players, onNext, onBack }: Props) {
    const allRoles = getAllRoles();
    const [roleCounts, setRoleCounts] = useState<Record<string, number>>(() => {
        // Default: one villager per player
        return { villager: players.length };
    });

    const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);
    const impCount = roleCounts["imp"] ?? 0;

    const incrementRole = (roleId: string) => {
        setRoleCounts({ ...roleCounts, [roleId]: (roleCounts[roleId] ?? 0) + 1 });
    };

    const decrementRole = (roleId: string) => {
        const current = roleCounts[roleId] ?? 0;
        if (current > 0) {
            const newCounts = { ...roleCounts, [roleId]: current - 1 };
            if (newCounts[roleId] === 0) {
                delete newCounts[roleId];
            }
            setRoleCounts(newCounts);
        }
    };

    const handleNext = () => {
        // Convert counts to array of role IDs
        const selectedRoles: string[] = [];
        for (const [roleId, count] of Object.entries(roleCounts)) {
            for (let i = 0; i < count; i++) {
                selectedRoles.push(roleId);
            }
        }
        onNext(selectedRoles);
    };

    const canProceed = totalRoles >= players.length && impCount >= 1;

    // Group roles by team
    const rolesByTeam: Record<string, RoleDefinition[]> = {
        townsfolk: allRoles.filter((r) => r.team === "townsfolk"),
        outsider: allRoles.filter((r) => r.team === "outsider"),
        minion: allRoles.filter((r) => r.team === "minion"),
        demon: allRoles.filter((r) => r.team === "demon"),
    };

    const teamColors: Record<string, string> = {
        townsfolk: "from-blue-500 to-blue-600",
        outsider: "from-cyan-500 to-cyan-600",
        minion: "from-orange-500 to-orange-600",
        demon: "from-red-600 to-red-700",
    };

    const teamLabels: Record<string, string> = {
        townsfolk: "Townsfolk",
        outsider: "Outsiders",
        minion: "Minions",
        demon: "Demons",
    };

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
                            Step 2: Select roles in play
                        </p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                    <div className="flex justify-between text-white">
                        <span>Players: {players.length}</span>
                        <span>Roles: {totalRoles}</span>
                    </div>
                    {totalRoles < players.length && (
                        <p className="text-yellow-300 text-sm mt-2">
                            ⚠️ Need at least {players.length} roles
                        </p>
                    )}
                    {impCount < 1 && (
                        <p className="text-red-300 text-sm mt-2">
                            ⚠️ Need at least 1 Imp
                        </p>
                    )}
                </div>

                {/* Role Selection by Team */}
                <div className="space-y-6 mb-6">
                    {Object.entries(rolesByTeam).map(([team, roles]) => (
                        <div key={team}>
                            <h2
                                className={`text-lg font-semibold text-white mb-3 px-2 py-1 rounded bg-gradient-to-r ${teamColors[team]}`}
                            >
                                {teamLabels[team]}
                            </h2>
                            <div className="space-y-2">
                                {roles.map((role) => {
                                    const count = roleCounts[role.id] ?? 0;
                                    return (
                                        <div
                                            key={role.id}
                                            className="bg-white/10 rounded-lg p-3 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">
                                                    {role.icon}
                                                </span>
                                                <div>
                                                    <div className="text-white font-medium">
                                                        {role.name}
                                                    </div>
                                                    <div className="text-purple-200 text-xs">
                                                        {role.description.length > 50
                                                            ? role.description.slice(0, 50) + "..."
                                                            : role.description}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => decrementRole(role.id)}
                                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition"
                                                >
                                                    -
                                                </button>
                                                <span className="text-white w-6 text-center font-bold">
                                                    {count}
                                                </span>
                                                <button
                                                    onClick={() => incrementRole(role.id)}
                                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

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
                    Next: Assign Roles
                </button>
            </div>
        </div>
    );
}
