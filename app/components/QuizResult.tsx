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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto space-y-4 sm:space-y-6 pb-8 px-4 sm:px-6"
        >
            <div className={`p-6 sm:p-12 glass-card border-none bg-muted/30 text-center relative overflow-hidden rounded-2xl sm:rounded-[3rem] shadow-2xl`}>
                <div className={`absolute top-0 inset-x-0 h-1.5 ${levelPassed ? 'bg-emerald-500' : 'bg-rose-500'} opacity-20`} />

                <div className="relative z-10 space-y-6 sm:space-y-8">
                    <motion.div
                        animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-20 h-20 sm:w-28 sm:h-28 mx-auto rounded-xl sm:rounded-[2rem] flex items-center justify-center shadow-2xl ${levelPassed ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'
                            }`}
                    >
                        {levelPassed ? <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-white" /> : <XCircle className="w-10 h-10 sm:w-14 sm:h-14 text-white" />}
                    </motion.div>

                    <div className="space-y-1 sm:space-y-2">
                        <h2 className={`text-2xl sm:text-4xl font-black italic tracking-tighter uppercase ${levelPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {levelPassed ? 'Level Cleared' : 'Attempt Failed'}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Result Output</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:gap-8 py-6 sm:py-8 border-y border-border/40">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Score</p>
                            <p className="text-2xl sm:text-4xl font-black text-foreground">{score}/{totalQuestions * 10}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">XP Gain</p>
                            <p className="text-2xl sm:text-4xl font-black text-primary">+{score}</p>
                        </div>
                    </div>

                    {levelPassed && currentLevel === 1 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 sm:p-8 rounded-xl sm:rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 text-left space-y-4 sm:space-y-6"
                        >
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl">
                                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-emerald-500/20" />
                                </div>
                                <div>
                                    <p className="font-black text-xs sm:text-sm uppercase tracking-tight text-foreground leading-none">Founder Bonus</p>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Special Access</p>
                                </div>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-muted-foreground leading-relaxed italic">
                                Support development with a <span className="text-emerald-500">$0.03 USDC</span> contribution on Base.
                            </p>

                            {!rewardTxHash ? (
                                <button
                                    onClick={onReward}
                                    disabled={rewardStatus === 'pending' || rewardStatus === 'success'}
                                    className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl text-white font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-3 transition-all shadow-xl ${rewardStatus === 'pending'
                                        ? 'bg-emerald-500/50 cursor-not-allowed'
                                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                        }`}
                                >
                                    <Wallet className="w-4 h-4" />
                                    {rewardStatus === 'pending' ? 'Wait...' : 'Support $0.03 USDC'}
                                </button>
                            ) : (
                                <div className="space-y-2 pt-1 border-t border-emerald-500/10">
                                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircle className="w-4 h-4" /> Thank you
                                    </div>
                                    <a
                                        href={`https://basescan.org/tx/${rewardTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] font-mono opacity-50 underline flex items-center gap-1"
                                    >
                                        TX: {rewardTxHash.slice(0, 12)}...
                                    </a>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {levelPassed && currentLevel > 1 && supportStatus !== 'success' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 sm:p-8 rounded-xl sm:rounded-[2rem] bg-primary/5 border border-primary/20 text-left space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Award className="w-5 h-5 text-primary" />
                                </div>
                                <p className="font-black text-xs sm:text-sm uppercase tracking-tight text-foreground">Elite Verification</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-muted-foreground leading-relaxed">
                                Join the <span className="text-primary font-black italic">Elite Leaderboard</span> and secure your verified proof.
                            </p>

                            <button
                                onClick={onSupport}
                                disabled={supportStatus === 'pending'}
                                className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-3 shadow-xl ${supportStatus === 'pending'
                                    ? 'bg-primary/50 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                                    }`}
                            >
                                <Award className="w-4 h-4" />
                                {supportStatus === 'pending' ? 'Syncing...' : 'Join Elite — $0.03'}
                            </button>
                        </motion.div>
                    )}

                    {!levelPassed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 sm:p-8 rounded-xl sm:rounded-[2rem] bg-amber-500/5 border border-amber-500/20 text-left space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="font-black text-xs sm:text-sm uppercase tracking-tight text-foreground">Fast Track Claim</p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-muted-foreground leading-relaxed">
                                Don't let a mistake stop your progress. <span className="text-amber-500 font-black italic">Claim this level</span> for just $0.03 USDC.
                            </p>

                            <button
                                onClick={onClaim}
                                disabled={claimStatus === 'pending' || claimStatus === 'success'}
                                className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-3 shadow-xl ${claimStatus === 'pending'
                                    ? 'bg-amber-500/50 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                    }`}
                            >
                                <Wallet className="w-4 h-4" />
                                {claimStatus === 'pending' ? 'Processing...' : claimStatus === 'success' ? 'Claimed!' : 'Claim Level — $0.03'}
                            </button>
                        </motion.div>
                    )}

                    <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                        {!levelPassed ? (
                            <button
                                onClick={onRetry}
                                className="w-full py-4 sm:py-6 bg-rose-500 hover:bg-rose-600 rounded-xl sm:rounded-2xl text-white font-black uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-3 sm:gap-4 transition-all shadow-xl shadow-rose-500/20"
                            >
                                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> RESTART ASSESSMENT
                            </button>
                        ) : (
                            <button
                                onClick={onNextLevel}
                                className="w-full py-4 sm:py-6 bg-foreground text-background rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-3 sm:gap-4 transition-all hover:bg-foreground/90 shadow-2xl"
                            >
                                NEXT LEVEL {currentLevel + 1} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all underline underline-offset-4 sm:underline-offset-8"
                        >
                            Return to hub
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8 border border-dashed border-border/60 rounded-xl sm:rounded-[2rem] text-center space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Proof Protocol</p>
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground leading-relaxed">
                    Cryptographic proof recorded on Base.
                </p>
            </div>
        </motion.div>
    );
};
