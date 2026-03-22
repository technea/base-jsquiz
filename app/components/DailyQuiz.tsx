"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Zap, Flame, X, Sparkles } from 'lucide-react';
import { DailyQuestion } from '../dailyQuizData';
import { AnimatedAvatar } from './AnimatedAvatar';

interface DailyQuizProps {
    isDarkMode: boolean;
    todayQuestion: DailyQuestion | null;
    dailyQuizAnswer: string | null;
    dailyQuizResult: 'correct' | 'wrong' | null;
    onAnswer: (opt: string) => void;
    onClose?: () => void;
}

export const DailyQuiz = ({
    isDarkMode,
    todayQuestion,
    dailyQuizAnswer,
    dailyQuizResult,
    onAnswer,
    onClose
}: DailyQuizProps) => {
    useEffect(() => {
        if (dailyQuizAnswer && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [dailyQuizAnswer, onClose]);

    if (!todayQuestion) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto space-y-8 pb-12 px-4 relative"
        >
            {/* ✨ Premium Background Elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full" />
            </div>

            <AnimatePresence>
                {dailyQuizAnswer && onClose && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={onClose}
                        className="absolute right-4 top-4 z-50 p-3 rounded-2xl bg-background/80 backdrop-blur-md border border-border shadow-2xl text-muted-foreground hover:text-foreground transition-all"
                    >
                        <X className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="text-center space-y-4 pt-10">
                {/* AI Mentor Avatar */}
                <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative mx-auto mb-8 flex justify-center"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute -top-12 -right-12 sm:-right-20 z-30 glass-card px-6 py-4 rounded-[2.5rem] bg-opacity-90 border-primary/20 shadow-2xl"
                    >
                        <p className="text-sm font-extrabold text-primary leading-tight">
                            Ready for the<br />
                            <span className="text-foreground">Daily Puzzle? ☕</span>
                        </p>
                    </motion.div>

                    <AnimatedAvatar
                        size={140}
                        isSpeaking={!dailyQuizAnswer}
                        mood={dailyQuizResult === 'correct' ? 'excited' : dailyQuizResult === 'wrong' ? 'thinking' : 'happy'}
                    />
                </motion.div>

                <div className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <Zap className="w-3 h-3 fill-amber-500" />
                        High Stakes Challenge
                    </motion.div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                        Daily <span className="text-primary italic">Puzzle</span>
                    </h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} tracking-wide`}>
                        ONE ATTEMPT • SURVIVE OR RESET
                    </p>
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                whileHover={{ y: -5 }}
                className="relative group"
            >
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-12" />
                <div className="relative glass-card p-6 sm:p-12 rounded-[2.5rem] bg-opacity-40 border-border/40 overflow-hidden">
                    <div className="absolute -top-6 -right-6 opacity-[0.05] pointer-events-none">
                        <BookOpen className="w-48 h-48" />
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-extrabold leading-tight text-foreground tracking-tight mb-10 relative z-10">
                        {todayQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 relative z-10">
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
                                    className={`w-full p-5 sm:p-7 rounded-3xl text-left font-bold transition-all border-2 flex items-center justify-between group relative overflow-hidden ${btnStyle}`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-6 w-full relative z-10">
                                        <span className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl flex items-center justify-center text-sm font-extrabold border-2 transition-all ${
                                            isSelected
                                                ? 'bg-primary border-primary text-white shadow-lg'
                                                : 'border-border/60 bg-white/5 text-muted-foreground group-hover:bg-primary/5 group-hover:border-primary/20'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 break-words text-lg sm:text-xl font-bold tracking-tight">
                                            {opt}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        {isAnswered && (isCorrect || isSelected) && (
                                            isCorrect ? <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" /> : <XCircle className="w-6 h-6 sm:w-8 sm:h-8" />
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
                        className={`p-6 sm:p-10 rounded-[2.5rem] border-2 shadow-2xl relative overflow-hidden backdrop-blur-md ${
                            dailyQuizResult === 'correct'
                                ? 'bg-success/5 border-success/20'
                                : 'bg-primary/5 border-primary/20'
                        }`}
                    >
                        <div className="flex gap-6 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                                dailyQuizResult === 'correct' ? 'bg-success/10' : 'bg-primary/10'
                            }`}>
                                {dailyQuizResult === 'correct'
                                    ? <CheckCircle className="w-8 h-8 text-success" />
                                    : <Sparkles className="w-8 h-8 text-primary" />
                                }
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Daily Insight</p>
                                    <p className="text-base sm:text-xl font-medium leading-relaxed text-foreground opacity-90">
                                        {todayQuestion.explanation}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                                    dailyQuizResult === 'correct' ? 'text-success' : 'text-error'
                                }`}>
                                    {dailyQuizResult === 'correct' ? (
                                        <>
                                            <Flame className="w-4 h-4" />
                                            Streak Extended! 🔥
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Streak Lost 💔
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

