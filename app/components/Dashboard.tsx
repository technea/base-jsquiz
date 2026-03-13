"use client";

import { motion } from 'framer-motion';
import { BookOpen, Wallet, ArrowRight, Award, Trophy, Bot, Sparkles } from 'lucide-react';
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
    farcasterUser?: any;
    onOpenAiChat?: () => void;
}

export const Dashboard = ({
    isDarkMode,
    globalStats,
    connectedAddress,
    basename,
    connectWallet,
    levelAttempts,
    onLevelSelect,
    MAX_FREE_ATTEMPTS,
    farcasterUser,
    onOpenAiChat
}: DashboardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
        >
            <div className="space-y-4">
                <motion.div
                    animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1],
                        y: [0, -5, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 mx-auto bg-gradient-premium rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30 relative"
                >
                    <BookOpen className="w-10 h-10 text-white" />
                    <motion.div 
                        animate={{ opacity: [0, 0.5, 0], scale: [1, 1.5, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-white/20 blur-xl rounded-full"
                    />
                </motion.div>
                <h2 className={`text-4xl sm:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    JAZZMINI <span className="text-primary italic">Quiz</span>
                </h2>
                <p className={`text-lg sm:text-xl font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-500'} max-w-2xl mx-auto`}>
                    Prepare for your <span className="text-primary font-bold">JavaScript Interview</span>!
                    Master concepts with {MAX_FREE_ATTEMPTS} attempts per level.
                </p>

                {/* Motivational JS Quotes */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className={`py-3 px-6 max-w-lg mx-auto rounded-full border border-dashed ${isDarkMode ? 'border-primary/30 bg-primary/5' : 'border-primary/40 bg-primary/5'}`}
                >
                    <p className={`text-base italic font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
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
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-primary/20 text-white' : 'bg-primary/10 text-primary'}`}>
                        <Wallet className="w-6 h-6" />
                    </div>
                    <h3 className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Web3 Rewards</h3>
                </div>

                {connectedAddress ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-3">
                            {farcasterUser?.pfp_url ? (
                                <img src={farcasterUser.pfp_url} alt="" className="w-10 h-10 rounded-full border-2 border-emerald-500/50" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg font-black text-emerald-500">
                                    {(farcasterUser?.display_name || basename || connectedAddress).slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-base font-black text-emerald-500">
                                    {farcasterUser?.display_name || basename || 'Connected'}
                                </p>
                                <p className="font-mono text-xs opacity-70 font-bold">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</p>
                            </div>
                        </div>
                        <Award className="text-emerald-500 w-5 h-5 shrink-0" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className={`text-base font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Connect your wallet to earn digital badges and verifiable proof of your JavaScript expertise.
                        </p>
                        <button
                            onClick={connectWallet}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all group relative overflow-hidden shadow-2xl hover:-translate-y-1 active:translate-y-0 ${
                                isDarkMode
                                    ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/30'
                                    : 'bg-gradient-premium hover:shadow-primary/40 text-white'
                            }`}
                        >
                            <motion.div 
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"
                            />
                            <span className="relative z-10 flex items-center gap-2">
                                Connect Wallet
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </span>
                        </button>
                    </div>
                )}
            </motion.div>

            {/* AI Generator Quiz Section */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                className={`p-6 sm:p-8 glass-card text-left max-w-md mx-auto relative overflow-hidden group border-2 ${isDarkMode ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-500/20 bg-indigo-50/50'}`}
            >
                {/* Background effects */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-purple-500/20 rounded-full blur-[30px] pointer-events-none group-hover:bg-purple-500/30 transition-all duration-500"></div>

                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} shadow-[0_0_20px_rgba(99,102,241,0.2)]`}>
                            <Bot className="w-8 h-8" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">New</span>
                        </div>
                    </div>

                    <div>
                        <h3 className={`font-black text-2xl sm:text-3xl mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            AI Quiz <span className="text-indigo-500 italic">Generator</span>
                        </h3>
                        <p className={`text-sm sm:text-base font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Bored of standard levels? Generate infinite custom JavaScript challenges tailored to your skill level using AI.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenAiChat}
                        className="mt-2 w-full py-4 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:shadow-xl hover:shadow-blue-500/25 rounded-xl text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all group/btn relative overflow-hidden"
                    >
                        <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"
                        />
                        <span className="relative z-10 flex items-center gap-2">
                            Ask AI Assistant
                            <Sparkles className="w-4 h-4 group-hover/btn:rotate-12 group-hover/btn:scale-110 transition-transform" />
                        </span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Level Grid - Optimized for Mobile */}
            <div className="space-y-4 pt-4">
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Level Selection</h3>
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.05
                            }
                        }
                    }}
                    className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 sm:gap-3"
                >
                    {[...Array(TOTAL_LEVELS)].map((_, i) => {
                        const level = i + 1;
                        const unlocked = level <= globalStats.highestLevel;
                        const isCurrent = level === globalStats.highestLevel;
                        const attemptsUsed = levelAttempts[level] || 0;

                        if (!unlocked) {
                            return (
                                <motion.div
                                    key={level}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.8 },
                                        visible: { opacity: 0.3, scale: 1 }
                                    }}
                                    className="h-12 relative flex items-center justify-center rounded-xl font-bold bg-slate-800/20 text-slate-600 cursor-not-allowed select-none"
                                >
                                    🔒
                                </motion.div>
                            );
                        }

                        return (
                            <motion.button
                                key={level}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.8, y: 10 },
                                    visible: { opacity: 1, scale: 1, y: 0 }
                                }}
                                whileHover={unlocked ? { scale: 1.15, y: -4, rotate: 5 } : {}}
                                whileTap={unlocked ? { scale: 0.9 } : {}}
                                onClick={() => onLevelSelect(level)}
                                disabled={!unlocked}
                                className={`h-12 relative flex items-center justify-center rounded-xl font-bold transition-all ${unlocked
                                    ? isCurrent
                                        ? 'bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20'
                                        : 'bg-gradient-premium text-white shadow-md'
                                    : 'bg-slate-800/20 text-slate-500 cursor-not-allowed opacity-40'
                                    }`}
                            >
                                {level}
                                {unlocked && attemptsUsed > 0 && (
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
                                    >
                                        {attemptsUsed}
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>
            </div>
        </motion.div>
    );
};
