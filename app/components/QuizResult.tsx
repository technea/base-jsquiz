"use client";

import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, ArrowRight, RefreshCw, Award, Lock, Zap, Wallet, Star, ShieldCheck } from 'lucide-react';

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
    claimStatus: string;
    onClaim: () => void;
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
    claimStatus,
    onClaim,
    onRetry,
    onNextLevel,
    connectedAddress
}: QuizResultProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto space-y-8 pb-12 px-6"
        >
            <div className="glass-card p-6 sm:p-10 relative overflow-hidden text-center shadow-2xl">
                {/* Dynamic Status Indicator */}
                <div className={`absolute top-0 inset-x-0 h-2 ${levelPassed ? 'bg-emerald-500' : 'bg-rose-500'} opacity-40`} />
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl ${levelPassed ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`} />

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-[2rem] flex items-center justify-center shadow-2xl ${
                            levelPassed ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
                        }`}
                    >
                        {levelPassed ? (
                            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                        ) : (
                            <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                        )}
                    </motion.div>

                    <div className="space-y-3">
                        <p className={`text-[11px] font-extrabold uppercase tracking-[0.4em] ${levelPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                            Performance Index
                        </p>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none">
                            {levelPassed ? 'Level Cleared' : 'Attempt Failed'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-10 border-y border-border/60">
                        <div className="text-center">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Final Score</p>
                            <p className="text-2xl sm:text-4xl font-extrabold text-foreground">
                                {score}<span className="text-lg sm:text-xl text-muted-foreground/40 font-bold ml-1">/{totalQuestions * 10}</span>
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Experience</p>
                            <p className="text-2xl sm:text-4xl font-extrabold text-primary">+{score}<span className="text-lg sm:text-xl opacity-40 ml-1">xp</span></p>
                        </div>
                    </div>

                    {/* Action Specialized Offers */}
                    <div className="space-y-6">
                        {levelPassed && currentLevel === 1 && (
                            <div className="p-5 sm:p-6 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/20 text-left space-y-4 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Star className="w-32 h-32" />
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-sm uppercase tracking-tight text-foreground">Founder Early Bird</p>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Special Beta Access</p>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
                                    Support our core development with a small <span className="text-foreground font-bold">$0.03 USDC</span> contribution and secure your founder status.
                                </p>

                                {!rewardTxHash ? (
                                    <button
                                        onClick={onReward}
                                        disabled={rewardStatus === 'pending' || rewardStatus === 'success'}
                                        className="btn-premium w-full py-3.5 rounded-xl font-extrabold text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        {rewardStatus === 'pending' ? 'Authorizing...' : 'Contribute $0.03 USDC'}
                                    </button>
                                ) : (
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-[11px] uppercase tracking-widest">
                                            <CheckCircle className="w-4 h-4" /> Receipt Verified
                                        </div>
                                        <a href={`https://basescan.org/tx/${rewardTxHash}`} className="text-[10px] font-mono text-muted-foreground hover:text-foreground truncate transition-colors">
                                            TX: {rewardTxHash}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {levelPassed && currentLevel > 1 && supportStatus !== 'success' && (
                            <div className="p-6 rounded-[1.5rem] bg-primary/5 border border-primary/20 text-left space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-[13px] uppercase tracking-tight text-foreground">Elite Verification</p>
                                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">Proof Assessment</p>
                                    </div>
                                </div>
                                <p className="text-[13px] font-medium text-muted-foreground">
                                    Secure your position on the <span className="text-foreground font-bold italic">Global Elite Leaderboard</span> and verify your curriculum progress on-chain.
                                </p>
                                <button
                                    onClick={onSupport}
                                    disabled={supportStatus === 'pending'}
                                    className="btn-premium w-full py-3.5 rounded-xl font-extrabold text-[10px] uppercase tracking-[0.2em]"
                                >
                                    {supportStatus === 'pending' ? 'Anchoring...' : 'Join Elite — $0.03'}
                                </button>
                            </div>
                        )}

                        {!levelPassed && (
                            <div className="p-6 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/20 text-left space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-[13px] uppercase tracking-tight text-foreground">Curriculum Unlock</p>
                                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">Fast Progress</p>
                                    </div>
                                </div>
                                <p className="text-[13px] font-medium text-muted-foreground">
                                    Don't repeat the assessment. <span className="text-foreground font-bold italic">Bypass validation</span> and unlock this level immediately.
                                </p>
                                <button
                                    onClick={onClaim}
                                    disabled={claimStatus === 'pending' || claimStatus === 'success'}
                                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 transition-all hover:-translate-y-1"
                                >
                                    {claimStatus === 'pending' ? 'Bypassing...' : claimStatus === 'success' ? 'Unlocked' : 'Claim Level — $0.03'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Primary Controller */}
                    <div className="pt-6 space-y-4">
                        {!levelPassed ? (
                            <button
                                onClick={onRetry}
                                className="w-full py-4 bg-rose-500 hover:bg-rose-600 rounded-xl text-white font-extrabold uppercase tracking-[0.2em] text-[13px] flex items-center justify-center gap-4 transition-all shadow-xl shadow-rose-500/20 hover:-translate-y-1"
                            >
                                <RefreshCw className="w-4 h-4" /> Re-Initialize Assessment
                            </button>
                        ) : (
                            <button
                                onClick={onNextLevel}
                                className="btn-premium w-full py-4 rounded-xl font-extrabold uppercase tracking-[0.2em] text-[13px] flex items-center justify-center gap-4"
                            >
                                <span>Advance to Level {currentLevel + 1}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 mx-auto pt-4 group"
                        >
                            Return to Interface Hub
                            <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 border border-dashed border-border/60 rounded-[2.5rem] text-center space-y-3 opacity-60">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-muted-foreground/60 leading-none mb-1">On-Chain Protocol</p>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Cryptographic proof recorded on Base Mainnet</span>
                </div>
            </div>
        </motion.div>
    );
};
