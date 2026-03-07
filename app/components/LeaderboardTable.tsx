"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Wallet } from 'lucide-react';

interface LeaderboardTableProps {
    isDarkMode: boolean;
    leaderboardData: any[];
    connectedAddress: string | null;
    onConnect: () => void;
}

const RANK_COLORS = [
    'from-amber-400 to-yellow-500',   // 1st - Gold
    'from-slate-300 to-slate-400',    // 2nd - Silver
    'from-orange-400 to-amber-600',   // 3rd - Bronze
];

const RANK_TEXT = ['🥇', '🥈', '🥉'];

export const LeaderboardTable = ({
    isDarkMode,
    leaderboardData,
    connectedAddress,
    onConnect
}: LeaderboardTableProps) => {
    const totalPoints = leaderboardData.reduce((a, p) => a + (Number(p.totalPoints) || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto space-y-4"
        >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl p-6 text-center"
                style={{ background: 'linear-gradient(135deg, #1a1f6e 0%, #2d1b69 40%, #1e3a8a 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-amber-400">
                        <Trophy className="w-6 h-6 fill-amber-400" />
                        <h2 className="text-2xl font-black text-white tracking-tight">Leaderboard</h2>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex gap-3 justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <span className="text-lg">🪙</span>
                            <div className="text-left">
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Total Points</p>
                                <p className="text-sm font-black text-white">{totalPoints.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Users className="w-4 h-4 text-white/60" />
                            <div className="text-left">
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Players</p>
                                <p className="text-sm font-black text-white">{leaderboardData.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Banner (if not connected) */}
            {!connectedAddress && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Connect Your Wallet</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Join the global rankings</p>
                        </div>
                    </div>
                    <button
                        onClick={onConnect}
                        className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all"
                    >
                        Connect
                    </button>
                </motion.div>
            )}

            {/* Player List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {leaderboardData.length > 0 ? (
                        leaderboardData.map((player, idx) => {
                            const isTop3 = idx < 3;
                            const shortAddress = player.address ? `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 'Unknown';
                            const fallbackName = player.basename ? player.basename : shortAddress;
                            const displayName = player.displayName || player.username || fallbackName;
                            // If display name is exactly shortAddress, we don't need to show initials as '0x'
                            const initials = displayName !== shortAddress ? displayName.slice(0, 2).toUpperCase() : '0x';
                            const isCurrentUser = connectedAddress && player.address?.toLowerCase() === connectedAddress.toLowerCase();

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCurrentUser
                                        ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10'
                                        : isDarkMode
                                            ? 'border-white/5 bg-white/5 hover:bg-white/10'
                                            : 'border-black/5 bg-black/5 hover:bg-black/10'
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className="w-8 shrink-0 text-center">
                                        {isTop3 ? (
                                            <span className="text-xl">{RANK_TEXT[idx]}</span>
                                        ) : (
                                            <span className={`text-sm font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                #{idx + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm text-white overflow-hidden relative ${isTop3
                                        ? `bg-gradient-to-br ${RANK_COLORS[idx]} shadow-lg`
                                        : 'bg-gradient-to-br from-primary/60 to-primary'
                                        }`}>
                                        {player.pfp ? (
                                            <img src={player.pfp} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            initials
                                        )}
                                        {isCurrentUser && (
                                            <div className="absolute inset-0 ring-2 ring-primary ring-offset-1 ring-offset-transparent rounded-2xl" />
                                        )}
                                    </div>

                                    {/* Name & Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-black text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {displayName}
                                            </p>
                                            {isCurrentUser && (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider shrink-0">You</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {displayName !== shortAddress && (
                                                <span className={`text-[10px] font-bold font-mono opacity-50 truncate`}>
                                                    {shortAddress}
                                                </span>
                                            )}
                                            {player.highestLevel > 1 && (
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/10 text-slate-600'}`}>
                                                    Lvl {player.highestLevel}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1 justify-end">
                                            <span className="text-lg">🪙</span>
                                            <span className={`text-xl font-black tracking-tighter ${isTop3 ? 'text-amber-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                {Number(player.totalPoints).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            pts
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-16 text-center space-y-3">
                            <div className="text-5xl">🏆</div>
                            <p className={`font-black text-sm tracking-widest uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                No players yet
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                Complete a quiz to appear here!
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
