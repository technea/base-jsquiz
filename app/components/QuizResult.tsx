"use client";

import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, ArrowRight, RefreshCw, Award, Lock, Zap, Wallet, Star } from 'lucide-react';

interface QuizResultProps {
    isDarkMode: boolean;
    levelPassed: boolean;
    score: number;
    totalQuestions: number;
    currentLevel: number;
    rewardStatus: string;
    rewardTxHash: string | null;
    onReward: () => void;
    supportStatus: string;
    onSupport: () => void;
    onRetry: () => void;
    onNextLevel: () => void;
    connectedAddress: string | null;
}

export const QuizResult = ({
    isDarkMode,
    levelPassed,
    score,
    totalQuestions,
    currentLevel,
    rewardStatus,
    rewardTxHash,
    onReward,
    supportStatus,
    onSupport,
    onRetry,
    onNextLevel,
    connectedAddress
}: QuizResultProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-md mx-auto p-8 rounded-3xl text-center space-y-8 glass-card border-2 ${levelPassed ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-rose-500/30'
                }`}
        >
            <div className="space-y-4">
                <motion.div
                    animate={{ rotate: levelPassed ? [0, 15, -15, 0] : 0 }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-xl ${levelPassed ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'
                        }`}
                >
                    {levelPassed ? <Trophy className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                </motion.div>

                <h2 className={`text-4xl font-black italic tracking-tighter ${levelPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {levelPassed ? 'Level Cleared!' : 'Try Again!'}
                </h2>

                <div className="flex items-center justify-center gap-4 py-2">
                    <div className="text-left">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Score</p>
                        <p className={`text-3xl font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{score}/{totalQuestions}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-800/10" />
                    <div className="text-left">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>XP Earned</p>
                        <p className="text-3xl font-black text-primary">+{score * 10}</p>
                    </div>
                </div>
            </div>

            {levelPassed && currentLevel === 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Star className="w-5 h-5 text-emerald-500 fill-current" />
                        </div>
                        <p className={`font-black text-sm text-left leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Founder Bonus: Support the Project!</p>
                    </div>
                    <p className={`text-sm font-medium text-left leading-relaxed italic opacity-80 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        You completed Level 1! Support the project by paying <span className="text-emerald-500 font-bold">$0.03 USDC</span> on Base. 🤝
                    </p>

                    {!rewardTxHash ? (
                        <button
                            onClick={onReward}
                            disabled={rewardStatus === 'pending' || rewardStatus === 'success'}
                            className={`w-full py-4 rounded-xl text-white font-black flex items-center justify-center gap-2 shadow-lg transition-all ${rewardStatus === 'pending'
                                ? 'bg-emerald-500/50 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-500/30'
                                }`}
                        >
                            <Wallet className="w-4 h-4" />
                            {rewardStatus === 'pending' ? 'Sending...' : 'Support with $0.03 USDC'}
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Thank you for supporting!
                            </p>
                            <a
                                href={`https://basescan.org/tx/${rewardTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono opacity-50 underline flex items-center justify-center gap-1"
                            >
                                View on BaseScan <ArrowRight className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </motion.div>
            )}

            {levelPassed && currentLevel > 1 && supportStatus !== 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Zap className="w-5 h-5 text-primary fill-current" />
                        </div>
                        <p className={`font-black text-sm text-left leading-tight tracking-tight uppercase ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Join the Elite Realm</p>
                    </div>
                    <p className={`text-xs text-left leading-relaxed font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Join the <span className="text-primary font-black uppercase">Elite Leaderboard</span> and unlock verified proof of your coding expertise.
                    </p>

                    <button
                        onClick={onSupport}
                        disabled={supportStatus === 'pending'}
                        className={`w-full py-4 rounded-xl text-white font-black flex items-center justify-center gap-2 shadow-lg ${supportStatus === 'pending'
                            ? 'bg-primary/50 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90 hover:shadow-primary/30'
                            }`}
                    >
                        <Award className="w-4 h-4" />
                        {supportStatus === 'pending' ? 'Sending...' : 'Join Elite — $0.03 USDC'}
                    </button>
                </motion.div>
            )}

            <div className="flex flex-col gap-3 py-4 pt-10">
                {!levelPassed ? (
                    <button
                        onClick={onRetry}
                        className="w-full py-5 bg-rose-500 hover:bg-rose-600 rounded-2xl text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" /> Retry Assessment
                    </button>
                ) : (
                    <button
                        onClick={onNextLevel}
                        className="w-full py-5 bg-primary hover:bg-primary/90 rounded-2xl text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:-translate-y-1 shadow-xl shadow-primary/20"
                    >
                        Advance to Next Level <ArrowRight className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={() => window.location.reload()}
                    className={`text-xs font-bold uppercase tracking-widest py-2 opacity-50 hover:opacity-100 transition-opacity`}
                >
                    Back to Selection
                </button>
            </div>

            <div className={`p-4 rounded-xl text-xs leading-relaxed font-medium border border-dashed ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-black/10 text-slate-600'
                }`}>
                <p className="uppercase font-black opacity-30 mb-2 tracking-[0.2em]">Web3 Proof of Skill</p>
                <p>Assessments are recorded on Base. Achieving Elite status allows your skills to be verified across the Farcaster ecosystem.</p>
            </div>
        </motion.div>
    );
};
