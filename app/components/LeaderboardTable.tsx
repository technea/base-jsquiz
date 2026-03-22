"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Wallet, ArrowRight } from 'lucide-react';

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
            className="max-w-2xl mx-auto space-y-8 px-4 pb-12"
        >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-10 text-center bg-primary shadow-2xl shadow-primary/20">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-xl mb-2">
                            <Trophy className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Hall of Fame</h2>
                        <p className="text-white/70 text-sm font-medium max-w-xs">
                            Top developers pushing the boundaries of JavaScript and Web3.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <div className="flex-1 max-w-[160px] flex flex-col items-center gap-1 px-4 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Global Points</p>
                            <p className="text-xl font-extrabold text-white tracking-tight">{totalPoints.toLocaleString()}</p>
                        </div>
                        <div className="flex-1 max-w-[160px] flex flex-col items-center gap-1 px-4 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Active Players</p>
                            <p className="text-xl font-extrabold text-white tracking-tight">{leaderboardData.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Integration Banner */}
            {!connectedAddress && (
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-[2rem] border-2 border-dashed border-primary/30 bg-primary/5 group"
                >
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Wallet className="w-7 h-7 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-lg font-extrabold text-foreground tracking-tight">Connect for On-Chain Proof</p>
                            <p className="text-sm font-medium text-muted-foreground">Unlock achievements and claim your global rank.</p>
                        </div>
                    </div>
                    <button
                        onClick={onConnect}
                        className="w-full sm:w-auto px-10 py-4 btn-premium rounded-2xl text-sm font-bold shadow-xl flex items-center justify-center gap-2"
                    >
                        Connect Wallet
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {/* Player List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {leaderboardData.length > 0 ? (
                        leaderboardData.map((player, idx) => {
                            const isTop3 = idx < 3;
                            const shortAddress = player.address ? `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 'Unknown';
                            const fallbackName = player.basename ? player.basename : shortAddress;
                            const displayName = player.displayName || player.username || fallbackName;
                            const initials = displayName !== shortAddress ? displayName.slice(0, 2).toUpperCase() : '0x';
                            const isCurrentUser = connectedAddress && player.address?.toLowerCase() === connectedAddress.toLowerCase();

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative flex items-center gap-4 p-5 sm:p-6 rounded-[2rem] border transition-all duration-300 ${
                                        isCurrentUser
                                            ? 'border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10 ring-2 ring-primary/20'
                                            : 'glass-card hover:bg-white/[0.02] border-border/40'
                                    }`}
                                >
                                    {/* Rank Marker */}
                                    <div className="w-10 shrink-0 flex justify-center">
                                        {isTop3 ? (
                                            <span className="text-3xl drop-shadow-md">{RANK_TEXT[idx]}</span>
                                        ) : (
                                            <span className="text-sm font-bold text-muted-foreground opacity-50 tracking-tighter">
                                                #{idx + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar/Profile Image */}
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] shrink-0 flex items-center justify-center font-extrabold text-white overflow-hidden relative shadow-lg ${
                                        isTop3
                                            ? `bg-gradient-to-br ${RANK_COLORS[idx]} ring-4 ring-white/10`
                                            : 'bg-primary/20 text-primary border border-primary/20'
                                    }`}>
                                        {player.pfp ? (
                                            <img src={player.pfp} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg">{initials}</span>
                                        )}
                                        {isCurrentUser && (
                                            <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                                        )}
                                    </div>

                                    {/* Player Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-extrabold truncate text-foreground tracking-tight">
                                                {displayName}
                                            </p>
                                            {isCurrentUser && (
                                                <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest shrink-0">
                                                    You
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            {displayName !== shortAddress && (
                                                <span className="text-[10px] font-mono font-medium text-muted-foreground/60 truncate">
                                                    {shortAddress}
                                                </span>
                                            )}
                                            {player.highestLevel > 1 && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                                                    Level {player.highestLevel}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Points Display */}
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="p-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold tracking-tighter uppercase">
                                                PTS
                                            </div>
                                            <span className={`text-2xl font-black tracking-tighter ${
                                                isTop3 ? 'text-amber-500' : 'text-foreground'
                                            }`}>
                                                {Number(player.totalPoints).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-24 text-center space-y-6">
                            <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mx-auto text-5xl">
                                🏆
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-extrabold text-foreground tracking-tight">The Arena is Quiet</p>
                                <p className="text-sm font-medium text-muted-foreground">Complete a challenge to be the first on the board.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

