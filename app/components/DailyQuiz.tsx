"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Zap, Flame, X } from 'lucide-react';
import { DailyQuestion } from '../dailyQuizData';

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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 pb-8 px-4 sm:px-6 relative"
        >
            <AnimatePresence>
                {dailyQuizAnswer && onClose && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={onClose}
                        className="absolute right-4 top-0 z-50 p-2 sm:p-3 rounded-full bg-background/80 backdrop-blur-sm border-2 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-primary/50 transition-all shadow-xl"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="text-center space-y-2 sm:space-y-3 pt-8 sm:pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-1 sm:mb-2">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">24H Challenge</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none italic uppercase">Daily <span className="text-primary not-italic">Puzzle</span></h2>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    High Stakes • One Attempt
                </p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-primary/10 rounded-2xl sm:rounded-[2.5rem] blur opacity-20"></div>
                <div className="relative glass-card p-6 sm:p-12 rounded-2xl sm:rounded-[2.5rem] bg-background/50 border-border/40 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-[0.03] select-none pointer-events-none">
                        <BookOpen className="w-32 h-32 sm:w-48 sm:h-48" />
                    </div>

                    <h3 className="text-xl sm:text-3xl font-black leading-tight text-foreground tracking-tight mb-8 sm:mb-12 relative z-10">
                        {todayQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4 relative z-10">
                        {todayQuestion.options.map((opt, idx) => {
                            const isSelected = dailyQuizAnswer === opt;
                            const isAnswered = !!dailyQuizAnswer;
                            const isCorrect = opt === todayQuestion.answer;

                            let btnStyle = "bg-muted/30 border-border/50 hover:border-primary/50 text-foreground";
                            if (isAnswered) {
                                if (isCorrect) btnStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]";
                                else if (isSelected) btnStyle = "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]";
                                else btnStyle = "opacity-40 grayscale blur-[0.5px] border-transparent scale-[0.98]";
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={!isAnswered ? { y: -2, scale: 1.01, backgroundColor: isDarkMode ? 'rgba(0, 82, 255, 0.05)' : 'rgba(0, 82, 255, 0.03)' } : {}}
                                    onClick={() => onAnswer(opt)}
                                    disabled={isAnswered}
                                    className={`w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group overflow-hidden ${btnStyle}`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-5 w-full">
                                        <span className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all ${isSelected
                                            ? 'bg-primary border-primary text-white shadow-lg'
                                            : 'border-border bg-background/50 text-muted-foreground'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 break-words text-sm sm:text-lg leading-snug">
                                            {opt}
                                        </span>
                                    </div>
                                    <div>
                                        {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />}
                                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {dailyQuizAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] border-2 shadow-2xl relative overflow-hidden ${dailyQuizResult === 'correct'
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-rose-500/5 border-rose-500/20'
                            }`}
                    >
                        <div className="flex gap-4 sm:gap-6 relative z-10">
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center ${dailyQuizResult === 'correct' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                }`}>
                                {dailyQuizResult === 'correct'
                                    ? <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                                    : <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500" />
                                }
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Detailed Breakdown</p>
                                <p className="text-sm sm:text-lg font-bold leading-relaxed italic text-foreground">{todayQuestion.explanation}</p>
                                {dailyQuizResult === 'correct' ? (
                                    <div className="pt-1 sm:pt-2 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                        <Flame className="w-3 h-3" /> Streak Extended
                                    </div>
                                ) : (
                                    <div className="pt-1 sm:pt-2 flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                        <XCircle className="w-3 h-3" /> Streak Lost
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
