"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Zap, Flame, X, Sparkles, Wallet } from 'lucide-react';
import { DailyQuestion } from '../dailyQuizData';
import { AnimatedAvatar } from './AnimatedAvatar';

interface DailyQuizProps {
    isDarkMode: boolean;
    todayQuestion: DailyQuestion | null;
    dailyQuizAnswer: string | null;
    dailyQuizResult: 'correct' | 'wrong' | null;
    onAnswer: (opt: string) => void;
    onClose?: () => void;
    paymentStatus?: 'idle' | 'pending' | 'success' | 'error';
    onPayment?: () => void;
    paymentTx?: string | null;
}

export const DailyQuiz = ({
    isDarkMode,
    todayQuestion,
    dailyQuizAnswer,
    dailyQuizResult,
    onAnswer,
    onClose,
    paymentStatus = 'idle',
    onPayment,
    paymentTx
}: DailyQuizProps) => {
    useEffect(() => {
        if (dailyQuizAnswer && onClose && paymentStatus === 'success') {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [dailyQuizAnswer, onClose, paymentStatus]);

    if (!todayQuestion) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-8 pb-8 sm:pb-12 px-3 sm:px-4 relative"
        >
            {/* Background glow */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] sm:h-[500px] bg-primary/5 blur-[100px] sm:blur-[120px] rounded-full" />
            </div>

            {/* Close Button */}
            <AnimatePresence>
                {dailyQuizAnswer && onClose && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={onClose}
                        className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-background/80 backdrop-blur-md border border-border shadow-2xl text-muted-foreground hover:text-foreground transition-all"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="text-center space-y-3 sm:space-y-4 pt-8 sm:pt-10">
                {/* AI Mentor Avatar */}
                <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative mx-auto mb-6 sm:mb-8 flex justify-center"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute -top-10 sm:-top-12 right-0 sm:-right-16 z-30 glass-card px-4 sm:px-6 py-2.5 sm:py-4 rounded-[2rem] sm:rounded-[2.5rem] bg-opacity-90 border-primary/20 shadow-2xl"
                    >
                        <p className="text-xs sm:text-sm font-extrabold text-primary leading-tight">
                            Ready for the<br />
                            <span className="text-foreground">Daily Puzzle? ☕</span>
                        </p>
                    </motion.div>

                    <AnimatedAvatar
                        size={110}
                        isSpeaking={!dailyQuizAnswer}
                        mood={dailyQuizResult === 'correct' ? 'excited' : dailyQuizResult === 'wrong' ? 'thinking' : 'happy'}
                    />
                </motion.div>

                <div className="space-y-1.5 sm:space-y-2">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                    >
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500" />
                        High Stakes Challenge
                    </motion.div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                        Daily <span className="text-primary italic">Puzzle</span>
                    </h2>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} tracking-wide`}>
                        ONE ATTEMPT • SURVIVE OR RESET
                    </p>
                </div>
            </div>

            {/* Question Card */}
            <motion.div whileHover={{ y: -3 }} className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-12" />
                <div className="relative glass-card p-4 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] bg-opacity-40 border-border/40 overflow-hidden">
                    <div className="absolute -top-6 -right-6 opacity-[0.05] pointer-events-none">
                        <BookOpen className="w-36 h-36 sm:w-48 sm:h-48" />
                    </div>

                    <h3 className="text-base sm:text-xl lg:text-2xl font-extrabold leading-snug sm:leading-tight text-foreground tracking-tight mb-5 sm:mb-8 lg:mb-10 relative z-10">
                        {todayQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5 sm:gap-4 relative z-10">
                        {todayQuestion.options.map((opt, idx) => {
                            const isSelected = dailyQuizAnswer === opt;
                            const isAnswered = !!dailyQuizAnswer;
                            const isCorrect = opt === todayQuestion.answer;

                            let btnStyle = "bg-background/40 border-border hover:border-primary/40 hover:bg-background/60 shadow-sm";

                            if (isAnswered) {
                                if (isCorrect) {
                                    btnStyle = "bg-success/5 border-success/30 text-success shadow-[0_0_40px_rgba(16,185,129,0.08)] ring-1 ring-success/10";
                                } else if (isSelected) {
                                    btnStyle = "bg-error/5 border-error/30 text-error shadow-[0_0_40px_rgba(244,63,94,0.08)] ring-1 ring-error/10";
                                } else {
                                    btnStyle = "opacity-30 grayscale-[50%] blur-[0.3px] border-transparent scale-[0.98]";
                                }
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    onClick={() => onAnswer(opt)}
                                    disabled={isAnswered}
                                    className={`w-full p-3.5 sm:p-5 rounded-xl sm:rounded-2xl lg:rounded-3xl text-left font-bold transition-all border-2 flex items-center justify-between group relative overflow-hidden ${btnStyle}`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-5 w-full relative z-10">
                                        <span className={`w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                                            isSelected
                                                ? 'bg-primary border-primary text-white shadow-lg'
                                                : 'border-border/60 bg-white/5 text-muted-foreground group-hover:bg-primary/5 group-hover:border-primary/20'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 break-words text-xs sm:text-base lg:text-lg font-bold tracking-tight leading-snug">
                                            {opt}
                                        </span>
                                    </div>
                                    <div className="relative z-10 shrink-0 ml-2">
                                        {isAnswered && (isCorrect || isSelected) && (
                                            isCorrect
                                                ? <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                                                : <XCircle className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Explanation Section */}
            <AnimatePresence>
                {dailyQuizAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border-2 shadow-2xl relative overflow-hidden backdrop-blur-md ${
                            dailyQuizResult === 'correct'
                                ? 'bg-success/5 border-success/20'
                                : 'bg-primary/5 border-primary/20'
                        }`}
                    >
                        <div className="flex flex-col gap-4 sm:gap-6 relative z-10 w-full">
                            {/* Icon + Explanation */}
                            <div className="flex gap-3 sm:gap-6">
                                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center ${
                                    dailyQuizResult === 'correct' ? 'bg-success/10' : 'bg-primary/10'
                                }`}>
                                    {dailyQuizResult === 'correct'
                                        ? <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
                                        : <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                    }
                                </div>
                                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                                    <div className="space-y-1">
                                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Daily Insight</p>
                                        <p className="text-sm sm:text-base lg:text-xl font-medium leading-relaxed text-foreground opacity-90 break-words">
                                            {todayQuestion.explanation}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                                        dailyQuizResult === 'correct' ? 'text-success' : 'text-error'
                                    }`}>
                                        {dailyQuizResult === 'correct' ? (
                                            <>
                                                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Streak Extended! 🔥
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                Streak Lost 💔
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment/Claim CTA */}
                            {paymentStatus !== 'success' ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onPayment}
                                    disabled={paymentStatus === 'pending'}
                                    className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                                        paymentStatus === 'pending'
                                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                            : 'bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/40'
                                    }`}
                                >
                                    {paymentStatus === 'pending' ? (
                                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                                    ) : (
                                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    )}
                                    {paymentStatus === 'pending' ? 'Broadcasting...' : 'Claim Achievement ($0.01 USDC)'}
                                </motion.button>
                            ) : (
                                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-success/10 border border-success/30 flex flex-col items-center gap-1.5 sm:gap-2 text-center">
                                    <div className="flex items-center gap-2 text-success font-bold text-xs sm:text-sm">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                        On-Chain Record Verified!
                                    </div>
                                    {paymentTx && (
                                        <a
                                            href={`https://basescan.org/tx/${paymentTx}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] sm:text-[10px] font-mono text-success/70 hover:underline flex items-center gap-1"
                                        >
                                            View Tx <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
