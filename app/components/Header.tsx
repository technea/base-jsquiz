"use client";

import { motion } from 'framer-motion';
import { Trophy, Sun, Moon, Wallet, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

interface HeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    activeTab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'base';
    setActiveTab: (tab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'base') => void;
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
        { id: 'base', label: '🔵 Base' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'leaderboard', label: 'Rankings' },
    ] as const;

    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-[100] w-full glass bg-opacity-90 backdrop-blur-xl border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Brand Section */}
                    <div 
                        onClick={() => {
                            setActiveTab('quiz');
                            setQuizState('start');
                        }}
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
                    >
                        <div className="p-1.5 sm:p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-none">
                                Jazz<span className="text-primary">mini</span>
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setQuizState('start');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${activeTab === item.id
                                    ? 'text-white'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                    }`}
                            >
                                {activeTab === item.id && (
                                    <motion.div 
                                        layoutId="navGlow"
                                        className="absolute inset-0 bg-primary rounded-lg -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors border border-border/50"
                            >
                                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
                            </button>
                            
                            {connectedAddress ? (
                                <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
                                    {farcasterUser?.pfp_url ? (
                                        <img src={farcasterUser.pfp_url} alt="" className="w-4 h-4 rounded-full" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                                            {(basename || connectedAddress).slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-bold text-[10px] text-primary">
                                        {(basename || connectedAddress).slice(0, 5)}...
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={connectWallet}
                                    className="btn-premium px-4 py-1.5 rounded-xl text-xs font-bold"
                                >
                                    Connect
                                </button>
                            )}
                        </div>

                        {/* Mobile Toggle Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-xl bg-muted/50 border border-border/50 text-foreground"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu (Toggle) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="lg:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden shadow-2xl"
                    >
                        <div className="px-4 py-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setQuizState('start');
                                            setIsMenuOpen(false);
                                        }}
                                        className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-center border ${
                                            activeTab === item.id
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-muted/30 border-border text-muted-foreground'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Settings</span>
                                    <button
                                        onClick={() => setIsDarkMode(!isDarkMode)}
                                        className="p-2 bg-muted/50 rounded-lg"
                                    >
                                        {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                                    </button>
                                </div>

                                {connectedAddress ? (
                                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                {(basename || connectedAddress).slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground">{(basename || connectedAddress).slice(0, 12)}...</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{connectedAddress}</span>
                                            </div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={()=>{
                                            connectWallet();
                                            setIsMenuOpen(false);
                                        }}
                                        className="btn-premium w-full py-3.5 rounded-xl text-xs font-bold"
                                    >
                                        Connect Wallet
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

