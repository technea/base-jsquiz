"use client";

import { motion } from 'framer-motion';
import { Trophy, Sun, Moon, Wallet, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

interface HeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    activeTab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard';
    setActiveTab: (tab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard') => void;
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { id: 'quiz', label: 'Quiz' },
        { id: 'daily', label: 'Daily' },
        { id: 'learn', label: 'Learn' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'leaderboard', label: 'Rankings' },
    ] as const;

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-[60] py-4 sm:py-6 glass-card bg-opacity-60 backdrop-blur-xl border-b border-white/5 mb-8 sm:mb-12"
        >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                {/* Logo Section */}
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setActiveTab('quiz');
                        setQuizState('start');
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                >
                    <div className="p-2 sm:p-2.5 bg-gradient-premium rounded-xl shadow-lg shadow-primary/20 relative">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-xl bg-white/20 blur-md" 
                        />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tighter leading-none text-foreground">
                            JAZZ<span className="text-primary italic">MINI</span>
                        </h1>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>v2.0 Beta</p>
                    </div>
                </motion.div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1 glass-card p-1 rounded-2xl">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setQuizState('start');
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative z-10 ${activeTab === item.id
                                ? 'text-white'
                                : `${isDarkMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                                }`}
                        >
                            {activeTab === item.id && (
                                <motion.div 
                                    layoutId="activeTabDesktop"
                                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Right side actions (Wallet, Theme, Menu Toggle) */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex items-center gap-3">
                        {connectedAddress ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-primary/20 bg-primary/5">
                                {farcasterUser?.pfp_url ? (
                                    <img src={farcasterUser.pfp_url} alt="" className="w-5 h-5 rounded-full border border-primary/30" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                                        {(basename || connectedAddress).slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                                <span className="font-black text-[10px] text-primary uppercase tracking-tight">
                                    {(basename || connectedAddress).slice(0, 10)}...
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={connectWallet}
                                className="px-5 py-2 rounded-xl bg-gradient-premium text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-all"
                            >
                                Connect
                            </button>
                        )}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2.5 glass-card hover:bg-primary/10 rounded-xl transition-all"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-slate-800" />}
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={toggleMenu}
                        className="lg:hidden p-2.5 glass-card rounded-xl text-foreground"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 top-[60px] sm:top-[88px] z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-[60px] sm:top-[88px] bottom-0 w-[280px] z-[58] bg-background border-l border-white/5 p-6 space-y-6 lg:hidden shadow-2xl overflow-y-auto no-scrollbar"
                        >
                            <nav className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-60 mb-4 px-2">Navigation</p>
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setQuizState('start');
                                            setIsMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${activeTab === item.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : `hover:bg-primary/5 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`
                                            }`}
                                    >
                                        <span className="truncate mr-2">{item.label}</span>
                                        {activeTab === item.id && <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                                    </button>
                                ))}
                            </nav>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-60 mb-2 px-2">Profile & Settings</p>
                                <div className="p-4 rounded-2xl glass-card border-white/5 bg-white/5">
                                    {connectedAddress ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-premium p-0.5">
                                                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                                    {farcasterUser?.pfp_url ? (
                                                        <img src={farcasterUser.pfp_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-primary">{(basename || connectedAddress).slice(0, 1).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-xs uppercase text-foreground">{basename || 'Premium User'}</span>
                                                <span className="font-mono text-[9px] opacity-60 break-all">{connectedAddress}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                connectWallet();
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full py-4 rounded-2xl bg-gradient-premium text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                        >
                                            Connect Wallet
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl glass-card border-white/5 hover:bg-white/5 transition-all text-sm font-black uppercase tracking-widest"
                                >
                                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                    {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                                </button>
                                <div className="h-20 sm:hidden" /> {/* Extra spacing for mobile bottom */}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.header>
    );
};
