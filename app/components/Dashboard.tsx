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
            className="text-center space-y-12 max-w-5xl mx-auto px-4"
        >
            {/* Hero Section */}
            <div className="space-y-6 pt-4 sm:pt-8">
                <motion.div
                    animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-primary rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 relative group"
                >
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                
                <div className="space-y-2">
                    <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Jazz<span className="text-primary italic">mini</span>
                    </h2>
                    <p className={`text-base sm:text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} max-w-lg mx-auto leading-relaxed`}>
                        Level up your <span className="text-primary font-bold">JavaScript</span> skills with interactive challenges and web3 rewards.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: 0.4 }}
                    className={`py-3 px-6 sm:px-8 max-w-xl mx-auto rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm`}
                >
                    <p className={`text-xs sm:text-base italic font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        "{JS_QUOTES[Math.floor(Math.random() * JS_QUOTES.length)]}"
                    </p>
                </motion.div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Section */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card p-6 text-left relative overflow-hidden flex flex-col justify-between h-full"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-xl tracking-tight">Web3 Proof</h3>
                        </div>

                        {connectedAddress ? (
                            <div className="flex items-center justify-between p-5 bg-primary/5 border border-primary/10 rounded-3xl">
                                <div className="flex items-center gap-4 min-w-0">
                                    {farcasterUser?.pfp_url ? (
                                        <img src={farcasterUser.pfp_url} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/20" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                                            {(farcasterUser?.display_name || basename || connectedAddress).slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {farcasterUser?.display_name || basename || 'Explorer'}
                                        </p>
                                        <p className="font-mono text-[10px] text-muted-foreground truncate">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</p>
                                    </div>
                                </div>
                                <Award className="text-primary w-5 h-5 shrink-0" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-base font-medium text-muted-foreground leading-relaxed">
                                    Connect your wallet to anchor your achievements on-chain and earn exclusive developer badges.
                                </p>
                                <button
                                    onClick={connectWallet}
                                    className="btn-premium w-full py-3.5 rounded-2xl text-[13px] flex items-center justify-center gap-2 group"
                                >
                                    Connect Wallet
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* AI Section */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card p-6 text-left relative overflow-hidden flex flex-col justify-between h-full border-primary/20 bg-primary/[0.02]"
                >
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-primary text-white shadow-xl shadow-primary/20">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest">
                                AI Powered
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 mb-4">
                            <h3 className="font-extrabold text-xl tracking-tight">AI Assistant</h3>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                                Need help with a concept? Our AI assistant is ready to generate personalized quizzes and explain complex topics.
                            </p>
                        </div>

                        <button
                            onClick={onOpenAiChat}
                            className="w-full py-3.5 rounded-2xl bg-foreground text-background font-bold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity group"
                        >
                            <Sparkles className="w-4 h-4 text-primary" />
                            Ask Assistant
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Level Selection Grid */}
            <div className="space-y-8 pt-6">
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-[0.25em]">Progress Roadmap</h3>
                    <p className="text-muted-foreground font-medium">Select a level to start your journey</p>
                </div>
                
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
                    }}
                    className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-6"
                >
                    {[...Array(TOTAL_LEVELS)].map((_, i) => {
                        const level = i + 1;
                        const unlocked = level <= globalStats.highestLevel;
                        const isCurrent = level === globalStats.highestLevel;
                        const attemptsUsed = levelAttempts[level] || 0;

                        return (
                            <motion.button
                                key={level}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9, y: 10 },
                                    visible: { opacity: 1, scale: 1, y: 0 }
                                }}
                                whileHover={unlocked ? { y: -8, scale: 1.05 } : {}}
                                whileTap={unlocked ? { scale: 0.95 } : {}}
                                onClick={() => onLevelSelect(level)}
                                disabled={!unlocked}
                                className={`aspect-square relative flex flex-col items-center justify-center rounded-[2rem] transition-all duration-300 ${
                                    unlocked
                                        ? isCurrent
                                            ? 'bg-primary text-white shadow-2xl shadow-primary/40 ring-4 ring-primary/20'
                                            : 'glass-card bg-opacity-50 text-foreground font-extrabold border-primary/10'
                                        : 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed border border-dashed border-border'
                                }`}
                            >
                                <span className={`text-xl sm:text-3xl font-black ${unlocked && !isCurrent ? 'text-primary' : ''}`}>
                                    {unlocked ? level : '🔒'}
                                </span>
                                <span className="text-[9px] font-bold mt-1 uppercase tracking-widest opacity-60">Level</span>
                                
                                {unlocked && attemptsUsed > 0 && (
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-error text-[10px] font-bold flex items-center justify-center text-white border-2 border-background shadow-lg"
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

