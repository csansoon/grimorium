import { useState } from "react";
import { GameState, PlayerState, isAlive, hasEffect, getAlivePlayers } from "../../lib/types";
import { getEffect } from "../../lib/effects";

type Props = {
    state: GameState;
    nomineeId: string;
    onVoteComplete: (votesFor: string[], votesAgainst: string[]) => void;
    onCancel: () => void;
};

type VoteValue = "for" | "against" | "abstain" | null;

export function VotingPhase({
    state,
    nomineeId,
    onVoteComplete,
    onCancel,
}: Props) {
    const nominee = state.players.find((p) => p.id === nomineeId);
    const [votes, setVotes] = useState<Record<string, VoteValue>>({});

    // Determine who can vote
    const canPlayerVote = (player: PlayerState): boolean => {
        if (!isAlive(player)) {
            // Dead players can vote if they haven't used their dead vote
            const deadEffect = getEffect("dead");
            if (deadEffect?.canVote) {
                return deadEffect.canVote(player, state);
            }
            return false;
        }
        return true;
    };

    const eligibleVoters = state.players.filter(
        (p) => p.id !== nomineeId && canPlayerVote(p)
    );

    const handleVote = (playerId: string, vote: VoteValue) => {
        setVotes({ ...votes, [playerId]: vote });
    };

    const handleConfirm = () => {
        const votesFor = Object.entries(votes)
            .filter(([_, vote]) => vote === "for")
            .map(([id]) => id);
        const votesAgainst = Object.entries(votes)
            .filter(([_, vote]) => vote === "against")
            .map(([id]) => id);

        onVoteComplete(votesFor, votesAgainst);
    };

    // Calculate vote counts
    const votesFor = Object.values(votes).filter((v) => v === "for").length;
    const votesAgainst = Object.values(votes).filter((v) => v === "against").length;
    const abstentions = Object.values(votes).filter((v) => v === "abstain").length;
    
    // Calculate majority based on alive players
    const aliveCount = getAlivePlayers(state).length;
    const majority = Math.ceil(aliveCount / 2);
    const willPass = votesFor >= majority;

    if (!nominee) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-800 to-orange-900 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">⚖️</div>
                    <h1 className="text-2xl font-bold text-white">
                        Vote: Execute {nominee.name}?
                    </h1>
                    <p className="text-orange-200">
                        Majority needed: {majority} votes
                    </p>
                </div>

                {/* Vote Tally */}
                <div className="bg-white/10 rounded-xl p-4 mb-6">
                    <div className="flex justify-around text-center">
                        <div>
                            <div className="text-3xl font-bold text-green-400">
                                {votesFor}
                            </div>
                            <div className="text-green-200 text-sm">For</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-red-400">
                                {votesAgainst}
                            </div>
                            <div className="text-red-200 text-sm">Against</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-400">
                                {abstentions}
                            </div>
                            <div className="text-gray-300 text-sm">Abstain</div>
                        </div>
                    </div>
                </div>

                {/* Voters */}
                <div className="space-y-2 mb-6">
                    {eligibleVoters.map((player) => {
                        const isDead = hasEffect(player, "dead");
                        const currentVote = votes[player.id];

                        return (
                            <div
                                key={player.id}
                                className="bg-white/10 rounded-lg p-3"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white flex items-center gap-2">
                                        {isDead && (
                                            <span
                                                className="text-xs bg-gray-600 px-1 rounded"
                                                title="Using dead vote"
                                            >
                                                💀
                                            </span>
                                        )}
                                        {player.name}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleVote(player.id, "for")
                                        }
                                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                                            currentVote === "for"
                                                ? "bg-green-500 text-white"
                                                : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                    >
                                        👍
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleVote(player.id, "against")
                                        }
                                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                                            currentVote === "against"
                                                ? "bg-red-500 text-white"
                                                : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                    >
                                        👎
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleVote(player.id, "abstain")
                                        }
                                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                                            currentVote === "abstain"
                                                ? "bg-gray-500 text-white"
                                                : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                    >
                                        —
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Execution Preview */}
                <div
                    className={`rounded-xl p-4 mb-4 text-center ${
                        willPass
                            ? "bg-red-600/30 border border-red-500"
                            : "bg-green-600/30 border border-green-500"
                    }`}
                >
                    {willPass ? (
                        <p className="text-red-200 font-medium">
                            ⚰️ {nominee.name} will be EXECUTED ({votesFor}/{majority} votes)
                        </p>
                    ) : (
                        <p className="text-green-200 font-medium">
                            ✓ {nominee.name} will NOT be executed ({votesFor}/{majority} votes needed)
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleConfirm}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition"
                    >
                        Confirm Votes
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl transition"
                    >
                        Cancel Nomination
                    </button>
                </div>
            </div>
        </div>
    );
}
