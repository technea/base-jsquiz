"use client";

import { motion } from 'framer-motion';
import { Trophy, Sun, Moon, Wallet } from 'lucide-react';

interface HeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    activeTab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'ai-chat';
    setActiveTab: (tab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'ai-chat') => void;
    setQuizState: (state: 'start' | 'in_progress' | 'result') => void;
    connectedAddress: string | null;
    connectWallet: () => void;
    farcasterUser: any;
    basename: string | null;
}

export const Header = ({
    isDarkMode,
    setIsDarkMode,
    activeTab,
    setActiveTab,
    setQuizState,
    connectedAddress,
    connectWallet,
    farcasterUser,
    basename
}: HeaderProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 sm:mb-16"
        >
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 sm:p-3 bg-gradient-premium rounded-2xl shadow-lg shadow-primary/20">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-foreground">JAZZ<span className="text-primary italic">MINI</span></h1>
                        <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>v2.0 Premium Experience</p>
                    </div>
                </div>

                {/* Mobile-only Theme Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="sm:hidden p-2.5 glass-card rounded-xl"
                >
                    {isDarkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-slate-800" />}
                </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                <nav className="flex items-center glass-card p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-[calc(100vw-48px)] sm:max-w-none">
                    {(['quiz', 'daily', 'learn', 'dashboard', 'leaderboard'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setQuizState('start');
                            }}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-primary text-white shadow-lg'
                                : `${isDarkMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="hidden sm:flex items-center gap-3">
                    {connectedAddress ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/5"
                        >
                            {farcasterUser?.pfp_url ? (
                                <img src={farcasterUser.pfp_url} alt="" className="w-6 h-6 rounded-full border border-primary/50" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-[10px] font-black text-white">
                                    {(basename || connectedAddress).slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div className="flex flex-col -space-y-0.5">
                                <span className="font-black text-xs text-primary uppercase tracking-tighter">
                                    {farcasterUser?.display_name || basename || 'Player'}
                                </span>
                                <span className={`font-mono text-[10px] font-bold opacity-80 ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className="px-6 py-2.5 rounded-2xl bg-gradient-premium text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                        >
                            Connect
                        </button>
                    )}

                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-3 glass-card hover:bg-primary/10 rounded-2xl transition-all"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-slate-800" />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
