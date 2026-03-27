"use client";

import { motion } from 'framer-motion';
import { Flame, Sun, CheckCircle, Wallet, RefreshCw } from 'lucide-react';
import { DailyQuestion } from '../dailyQuizData';

interface DailyArenaProps {
    isDarkMode: boolean;
    dailyStreak: number;
    lastGmDate: string | null;
    streakMissed: boolean;
    streakRecoveryStatus: string;
    onStreakRestore: () => void;
    onResetStreak: () => void;
    gmDoneToday: boolean;
    onGm: () => void;
}

export const DailyArena = ({
    isDarkMode,
    dailyStreak,
    lastGmDate,
    streakMissed,
    streakRecoveryStatus,
    onStreakRestore,
    onResetStreak,
    gmDoneToday,
    onGm
}: DailyArenaProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-xl mx-auto px-4"
        >
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                    Daily Ritual
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Daily Arena</h2>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} max-w-xs mx-auto`}>
                    Maintain your streak and claim your status in the JavaScript community.
                </p>
            </div>

            {/* 🔥 Streak Display */}
            <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card p-10 text-center relative overflow-hidden group border-amber-500/20 bg-amber-500/[0.02]"
            >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <Flame className={`w-20 h-20 ${dailyStreak > 0 ? 'text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-300'}`} />
                        {dailyStreak > 0 && (
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full"
                            />
                        )}
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-6xl font-black text-amber-500 tabular-nums tracking-tighter">{dailyStreak}</p>
                        <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current Day Streak</p>
                    </div>

                    {lastGmDate && (
                        <div className="px-4 py-1.5 rounded-full bg-background/50 border border-border shadow-sm">
                            <p className="text-[10px] font-mono font-bold text-muted-foreground">LAST GM: {lastGmDate}</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ⚠️ Streak Missed Warning */}
            {streakMissed && streakRecoveryStatus !== 'success' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 border-error/30 bg-error/[0.03] space-y-6 text-center"
                >
                    <div className="w-16 h-16 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto text-3xl">
                        💔
                    </div>
                    
                    <div className="space-y-2">
                        <p className="font-extrabold text-error text-xl tracking-tight">Streak at Risk!</p>
                        <p className={`text-base font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                            Time is running out. Pay <span className="text-primary font-bold">$0.03 USDC</span> to recover your progress, or start from scratch tomorrow.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onStreakRestore}
                            disabled={streakRecoveryStatus === 'pending'}
                            className={`w-full py-5 rounded-3xl font-bold text-base flex items-center justify-center gap-3 transition-all ${
                                streakRecoveryStatus === 'pending'
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                    : 'bg-foreground text-background shadow-xl hover:opacity-90'
                            }`}
                        >
                            {streakRecoveryStatus === 'pending' ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Wallet className="w-5 h-5 text-primary" />
                                    Restore Streak — $0.03 USDC
                                </>
                            )}
                        </motion.button>

                        <button
                            onClick={onResetStreak}
                            className="text-xs font-bold text-muted-foreground hover:text-error transition-colors uppercase tracking-widest"
                        >
                            Reset My Streak
                        </button>
                    </div>
                </motion.div>
            )}

            {streakRecoveryStatus === 'success' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-[2rem] bg-success/5 border border-success/20 text-center"
                >
                    <p className="text-sm font-bold text-success flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Streak successfully restored! 🔥
                    </p>
                </motion.div>
            )}

            {/* 🌅 GM Button */}
            {!gmDoneToday && (
                <div className="glass-card p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-50" />
                    
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <Sun className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="font-extrabold text-xl tracking-tight">Morning Ritual</p>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Punch in to continue your journey</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGm}
                        className="w-full py-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-2xl flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 group"
                    >
                        ☀️ 
                        <span className="group-hover:translate-x-1 transition-transform">Send GM</span>
                    </motion.button>
                </div>
            )}

            {gmDoneToday && (
                <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-10 rounded-[2.5rem] bg-success/5 border border-success/20 text-center space-y-4 shadow-2xl shadow-success/10"
                >
                    <div className="w-16 h-16 bg-success/10 text-success rounded-3xl flex items-center justify-center mx-auto">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-extrabold text-success tracking-tight">GM Complete!</p>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Come back tomorrow for Day {dailyStreak + 1}</p>
                    </div>
                </motion.div>
            )}

            {/* Daily Stats Info */}
            <div className={`p-6 rounded-[2rem] border border-dashed text-center space-y-3 ${isDarkMode ? 'border-primary/20 bg-primary/5' : 'border-primary/10 bg-primary/[0.02]'}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Rules of Engagement</p>
                <div className={`text-sm leading-relaxed font-medium space-y-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <p>• Send GM to unlock your daily challenge</p>
                    <p>• You have one attempt per day to stay in the loop</p>
                    <p>• Failure to answer correctly resets your streak to 0</p>
                </div>
            </div>
        </motion.div>
    );
};

