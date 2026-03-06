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
            className="space-y-6 max-w-lg mx-auto"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Daily Arena</h2>
                <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    GM • Streak • Daily Challenge
                </p>
            </div>

            {/* 🔥 Streak Display */}
            <div className="glass-card p-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                    <Flame className={`w-10 h-10 ${dailyStreak > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-600'}`} />
                    <div>
                        <p className="text-5xl font-black text-amber-500">{dailyStreak}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Day Streak</p>
                    </div>
                </div>
                {lastGmDate && (
                    <p className="text-[10px] text-slate-500 font-mono italic opacity-50">Last GM: {lastGmDate}</p>
                )}
            </div>

            {/* ⚠️ Streak Missed Warning */}
            {streakMissed && streakRecoveryStatus !== 'success' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 border-2 border-rose-500/30 bg-rose-500/5 space-y-4 text-center"
                >
                    <div className="text-3xl">💔</div>
                    <div>
                        <p className="font-black text-rose-500 uppercase tracking-widest text-sm">Streak Missed!</p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            You missed a day! Pay <span className="text-amber-400 font-black">$0.05 USDC</span> to restore your steak, or it resets to 0.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onStreakRestore}
                        disabled={streakRecoveryStatus === 'pending'}
                        className={`w-full py-4 rounded-xl text-white font-black flex items-center justify-center gap-2 shadow-lg ${streakRecoveryStatus === 'pending'
                            ? 'bg-rose-500/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-rose-500/40'
                            }`}
                    >
                        {streakRecoveryStatus === 'pending' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Wallet className="w-5 h-5" />
                                Restore Streak — $0.05 USDC
                            </>
                        )}
                    </motion.button>

                    <button
                        onClick={onResetStreak}
                        className="w-full py-2 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-rose-400 transition-all underline underline-offset-4"
                    >
                        No thanks, reset my streak
                    </button>
                </motion.div>
            )}

            {streakRecoveryStatus === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-xs font-bold text-emerald-500">✅ Streak Restored! Don't miss again! 🔥</p>
                </div>
            )}

            {/* 🌅 GM Button */}
            {!gmDoneToday && (
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Sun className="w-6 h-6 text-amber-500" />
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest">Daily GM</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Punch in for the day</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGm}
                        className="w-full py-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xl flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
                    >
                        ☀️ Send GM
                    </motion.button>
                </div>
            )}

            {gmDoneToday && (
                <div className="py-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                    <p className="text-2xl font-black text-emerald-500 flex items-center justify-center gap-2">
                        <CheckCircle className="w-6 h-6" /> GM Complete!
                    </p>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Come back tomorrow for Day {dailyStreak + 1}</p>
                </div>
            )}

            {/* Daily Stats Info */}
            <div className={`p-4 rounded-xl border border-dashed text-center space-y-1 ${isDarkMode ? 'border-white/10 text-slate-500' : 'border-black/10 text-slate-400'}`}>
                <p className="text-[10px] uppercase font-black tracking-widest">The Daily Loop</p>
                <p className="text-[10px] leading-relaxed">
                    1. GM to unlock Daily Quiz<br />
                    2. One chance to answer correctly<br />
                    3. Success = Streak grows 🔥 • Fail = Reset to 0 💔
                </p>
            </div>
        </motion.div>
    );
};
