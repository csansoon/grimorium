import { useState, useMemo } from "react";
import { getRole } from "../../lib/roles";

type Props = {
    players: string[];
    selectedRoles: string[]; // Role IDs (can have duplicates)
    onStart: (assignments: { name: string; roleId: string }[]) => void;
    onBack: () => void;
};

export function RoleAssignment({ players, selectedRoles, onStart, onBack }: Props) {
    // Track which roles are manually assigned to which players
    // null means "random"
    const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
        const initial: Record<string, string | null> = {};
        players.forEach((name) => {
            initial[name] = null; // All random by default
        });
        return initial;
    });

    // Count how many of each role are available
    const rolePool = useMemo(() => {
        const pool: Record<string, number> = {};
        for (const roleId of selectedRoles) {
            pool[roleId] = (pool[roleId] ?? 0) + 1;
        }
        return pool;
    }, [selectedRoles]);

    // Count how many of each role are already assigned
    const assignedCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const roleId of Object.values(assignments)) {
            if (roleId) {
                counts[roleId] = (counts[roleId] ?? 0) + 1;
            }
        }
        return counts;
    }, [assignments]);

    // Get available roles for a player (roles that still have unassigned copies)
    const getAvailableRoles = (playerName: string) => {
        const currentAssignment = assignments[playerName];
        const available: string[] = [];

        for (const [roleId, total] of Object.entries(rolePool)) {
            const assigned = assignedCounts[roleId] ?? 0;
            const isCurrentlyAssigned = currentAssignment === roleId;
            
            // Available if: there are unassigned copies, OR this player already has it
            if (assigned < total || isCurrentlyAssigned) {
                available.push(roleId);
            }
        }

        return available;
    };

    const handleAssignment = (playerName: string, roleId: string | null) => {
        setAssignments({ ...assignments, [playerName]: roleId });
    };

    const handleRandomizeAll = () => {
        // Reset all to random
        const reset: Record<string, string | null> = {};
        players.forEach((name) => {
            reset[name] = null;
        });
        setAssignments(reset);
    };

    const handleStart = () => {
        // Build final assignments
        const finalAssignments: { name: string; roleId: string }[] = [];
        
        // Create a pool of unassigned roles
        const remainingRoles: string[] = [...selectedRoles];
        
        // First, handle manual assignments
        for (const [playerName, roleId] of Object.entries(assignments)) {
            if (roleId) {
                finalAssignments.push({ name: playerName, roleId });
                // Remove one instance of this role from the pool
                const index = remainingRoles.indexOf(roleId);
                if (index !== -1) {
                    remainingRoles.splice(index, 1);
                }
            }
        }

        // Then, randomly assign remaining roles to players without assignments
        const unassignedPlayers = players.filter((name) => !assignments[name]);
        
        // Shuffle remaining roles
        const shuffled = [...remainingRoles].sort(() => Math.random() - 0.5);
        
        for (const playerName of unassignedPlayers) {
            const roleId = shuffled.pop();
            if (roleId) {
                finalAssignments.push({ name: playerName, roleId: roleId });
            }
        }

        onStart(finalAssignments);
    };

    // Check if at least one Imp is assigned or will be randomly assigned
    const impInPool = selectedRoles.includes("imp");
    const manuallyAssignedCount = Object.values(assignments).filter((r) => r !== null).length;
    const willBeRandomlyAssigned = players.length - manuallyAssignedCount;
    
    // Roles that will be in the random pool
    const rolesInRandomPool = selectedRoles.filter((roleId) => {
        const manualCount = assignedCounts[roleId] ?? 0;
        return selectedRoles.filter((r) => r === roleId).length > manualCount;
    });
    
    const impManuallyAssigned = Object.values(assignments).includes("imp");
    const impInRandomPool = rolesInRandomPool.includes("imp");
    const impWillBeAssigned = impManuallyAssigned || (willBeRandomlyAssigned > 0 && impInRandomPool);

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
                            Step 3: Assign roles (optional)
                        </p>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                    <p className="text-purple-200 text-sm">
                        Optionally assign specific roles to players. Unassigned players will get random roles from the remaining pool.
                    </p>
                    <button
                        onClick={handleRandomizeAll}
                        className="mt-3 text-purple-300 hover:text-white text-sm underline"
                    >
                        Reset all to random
                    </button>
                </div>

                {/* Player Assignments */}
                <div className="space-y-3 mb-6">
                    {players.map((playerName) => {
                        const currentRole = assignments[playerName];
                        const availableRoles = getAvailableRoles(playerName);
                        const role = currentRole ? getRole(currentRole) : null;

                        return (
                            <div
                                key={playerName}
                                className="bg-white/10 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium">
                                        {playerName}
                                    </span>
                                    {role && (
                                        <span className="text-2xl">{role.icon}</span>
                                    )}
                                </div>
                                <select
                                    value={currentRole ?? ""}
                                    onChange={(e) =>
                                        handleAssignment(
                                            playerName,
                                            e.target.value || null
                                        )
                                    }
                                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                                >
                                    <option value="" className="bg-gray-800">
                                        🎲 Random
                                    </option>
                                    {availableRoles.map((roleId) => {
                                        const r = getRole(roleId);
                                        if (!r) return null;
                                        return (
                                            <option
                                                key={roleId}
                                                value={roleId}
                                                className="bg-gray-800"
                                            >
                                                {r.icon} {r.name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        );
                    })}
                </div>

                {/* Remaining Roles Pool */}
                {rolesInRandomPool.length > 0 && willBeRandomlyAssigned > 0 && (
                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <h3 className="text-white font-medium mb-2">
                            Random Pool ({rolesInRandomPool.length} roles for {willBeRandomlyAssigned} players)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {rolesInRandomPool.map((roleId, i) => {
                                const r = getRole(roleId);
                                return (
                                    <span
                                        key={`${roleId}-${i}`}
                                        className="px-2 py-1 bg-white/10 rounded text-white text-sm"
                                    >
                                        {r?.icon} {r?.name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Warning if Imp won't be assigned */}
                {!impWillBeAssigned && impInPool && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-200 text-sm">
                            ⚠️ The Imp is in the role pool but won't be assigned to anyone! 
                            Make sure at least one player gets the Imp or leave some players random.
                        </p>
                    </div>
                )}

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition duration-300"
                >
                    Start Game 🎮
                </button>
            </div>
        </div>
    );
}
