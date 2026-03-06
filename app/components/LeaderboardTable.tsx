"use client";

import { motion } from 'framer-motion';
import { Trophy, Award, Users, Star } from 'lucide-react';

interface LeaderboardTableProps {
    isDarkMode: boolean;
    leaderboardTab: 'free' | 'elite';
    setLeaderboardTab: (tab: 'free' | 'elite') => void;
    leaderboardElite: any[];
    leaderboardFree: any[];
}

export const LeaderboardTable = ({
    isDarkMode,
    leaderboardTab,
    setLeaderboardTab,
    leaderboardElite,
    leaderboardFree
}: LeaderboardTableProps) => {
    const currentData = leaderboardTab === 'elite' ? leaderboardElite : leaderboardFree;

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

            <div className="flex p-1 glass-card rounded-2xl max-w-xs mx-auto">
                <button
                    onClick={() => setLeaderboardTab('elite')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${leaderboardTab === 'elite'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : `${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                        }`}
                >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Elite
                </button>
                <button
                    onClick={() => setLeaderboardTab('free')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${leaderboardTab === 'free'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : `${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                        }`}
                >
                    <Users className="w-3.5 h-3.5" />
                    Free
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'}`}>
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className={`col-span-2 text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Rank</div>
                        <div className={`col-span-6 text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Player</div>
                        <div className={`col-span-4 text-right text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Score</div>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {currentData.length > 0 ? (
                        currentData.map((player, idx) => (
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
                                            (player.username || player.basename || player.address).slice(0, 1).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{player.username || player.basename}</span>
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
                        <div className="p-12 text-center space-y-3 opacity-40">
                            <Users className="w-10 h-10 mx-auto" />
                            <p className="font-bold text-sm tracking-widest uppercase">No players yet</p>
                        </div>
                    )}
                </div>

                <div className={`p-4 ${isDarkMode ? 'bg-black/20' : 'bg-white/20'}`}>
                    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-xl">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Star className="w-4 h-4 text-primary fill-current" />
                        </div>
                        <p className={`text-xs font-black leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {leaderboardTab === 'elite'
                                ? "Elite players have supported JAZZMINI development and unlocked verified blockchain credentials."
                                : "Free players are ranking by total points earned across all completed levels."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
