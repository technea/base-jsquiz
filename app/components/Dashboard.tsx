"use client";

import { motion } from 'framer-motion';
import { BookOpen, Wallet, ArrowRight, Award, Trophy } from 'lucide-react';
import { GlobalStats, TOTAL_LEVELS, JS_QUOTES, LEVEL_ICONS } from '../types';

interface DashboardProps {
    isDarkMode: boolean;
    globalStats: GlobalStats;
    connectedAddress: string | null;
    basename: string | null;
    connectWallet: () => void;
    levelAttempts: Record<number, number>;
    onLevelSelect: (level: number) => void;
    MAX_FREE_ATTEMPTS: number;
}

export const Dashboard = ({
    isDarkMode,
    globalStats,
    connectedAddress,
    basename,
    connectWallet,
    levelAttempts,
    onLevelSelect,
    MAX_FREE_ATTEMPTS
}: DashboardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
        >
            <div className="space-y-4">
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="w-20 h-20 mx-auto bg-gradient-premium rounded-3xl flex items-center justify-center shadow-lg"
                >
                    <BookOpen className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className={`text-4xl sm:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    JAZZMINI <span className="text-primary italic">Quiz</span>
                </h2>
                <p className={`text-lg sm:text-xl font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} max-w-2xl mx-auto`}>
                    Prepare for your <span className="text-primary font-bold">JavaScript Interview</span>!
                    Master concepts with {MAX_FREE_ATTEMPTS} attempts per level.
                </p>

                {/* Motivational JS Quotes */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className={`py-3 px-6 max-w-lg mx-auto rounded-full border border-dashed ${isDarkMode ? 'border-primary/30 bg-primary/5' : 'border-primary/40 bg-primary/5'}`}
                >
                    <p className={`text-base italic font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        "{JS_QUOTES[Math.floor(Math.random() * JS_QUOTES.length)]}"
                    </p>
                </motion.div>
            </div>

            {/* Wallet Section */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                className={`p-6 glass-card text-left max-w-md mx-auto ${isDarkMode ? 'glass-blue' : ''}`}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                        <Wallet className="w-6 h-6" />
                    </div>
                    <h3 className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Web3 Rewards</h3>
                </div>

                {connectedAddress ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div>
                            <p className="text-base font-black text-emerald-500">{basename || 'Connected'}</p>
                            <p className="font-mono text-xs opacity-70 font-bold">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</p>
                        </div>
                        <Award className="text-emerald-500 w-5 h-5" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className={`text-base font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Connect your wallet to earn digital badges and verifiable proof of your JavaScript expertise.
                        </p>
                        <button
                            onClick={connectWallet}
                            className="w-full py-4 bg-[#0052FF] hover:bg-[#0041CC] hover:shadow-xl hover:shadow-blue-600/30 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all group"
                        >
                            Connect Wallet
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Level Grid - Optimized for Mobile */}
            <div className="space-y-4 pt-4">
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Level Selection</h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
                    {[...Array(TOTAL_LEVELS)].map((_, i) => {
                        const level = i + 1;
                        const unlocked = level <= globalStats.highestLevel;
                        const isCurrent = level === globalStats.highestLevel;
                        const attemptsUsed = levelAttempts[level] || 0;

                        return (
                            <motion.button
                                key={level}
                                whileHover={unlocked ? { scale: 1.1, y: -2 } : {}}
                                whileTap={unlocked ? { scale: 0.95 } : {}}
                                onClick={() => onLevelSelect(level)}
                                disabled={!unlocked}
                                className={`h-12 relative flex items-center justify-center rounded-xl font-bold transition-all ${unlocked
                                    ? isCurrent
                                        ? 'bg-primary text-white shadow-lg ring-2 ring-primary/50'
                                        : 'bg-gradient-premium text-white'
                                    : 'bg-slate-800/20 text-slate-500 cursor-not-allowed opacity-40'
                                    }`}
                            >
                                {level}
                                {unlocked && attemptsUsed > 0 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[8px] flex items-center justify-center border border-white dark:border-slate-900">
                                        {attemptsUsed}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
