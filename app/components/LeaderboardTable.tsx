"use client";

import { motion } from 'framer-motion';
import { Trophy, Award, Users, Star } from 'lucide-react';

interface LeaderboardTableProps {
    isDarkMode: boolean;
    leaderboardData: any[];
    connectedAddress: string | null;
    onConnect: () => void;
}

export const LeaderboardTable = ({
    isDarkMode,
    leaderboardData,
    connectedAddress,
    onConnect
}: LeaderboardTableProps) => {

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto"
        >
            <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-premium rounded-2xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Global Rankings</h2>
            </div>

            {/* Connect Wallet Banner */}
            {!connectedAddress && (
                <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-primary/30 bg-primary/5' : 'border-primary/30 bg-primary/5'
                    }`}>
                    <div>
                        <p className={`font-black text-sm uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            🔒 Wallet Connect Karen
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Sirf wallet-connected users leaderboard mein show honge.
                        </p>
                    </div>
                    <button
                        onClick={onConnect}
                        className="shrink-0 px-6 py-3 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
                    >
                        Connect Wallet
                    </button>
                </div>
            )}



            <div className="glass-card overflow-hidden">
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className={`col-span-2 text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Rank</div>
                        <div className={`col-span-6 text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Player</div>
                        <div className={`col-span-4 text-right text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Score</div>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {leaderboardData.length > 0 ? (
                        leaderboardData.map((player, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-primary/5 transition-colors`}
                            >
                                <div className="col-span-2 flex items-center gap-3">
                                    <span className={`text-sm font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-500'}`}>
                                        #{idx + 1}
                                    </span>
                                </div>
                                <div className="col-span-6 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                                        {player.pfp ? (
                                            <img src={player.pfp} alt="" className="w-full h-full rounded-lg object-cover" />
                                        ) : (
                                            (player.displayName || player.username || player.basename || player.address).slice(0, 1).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{player.displayName || player.username || player.basename || "Player"}</span>
                                        <span className="text-[11px] font-mono opacity-50 font-bold">{player.address.slice(0, 6)}...{player.address.slice(-4)}</span>
                                    </div>
                                </div>
                                <div className="col-span-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-primary tracking-tighter">{player.totalPoints}</span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Points</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-12 text-center space-y-3 opacity-80">
                            <Users className="w-10 h-10 mx-auto text-white/40" />
                            <p className="font-bold text-sm tracking-widest uppercase text-white">No players yet</p>
                        </div>
                    )}
                </div>

                <div className={`p-4 ${isDarkMode ? 'bg-black/20' : 'bg-white/20'}`}>
                    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-xl">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Star className="w-4 h-4 text-primary fill-current" />
                        </div>
                        <p className={`text-xs font-black leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            Players are ranked by total points earned across all completed levels and daily challenges.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
