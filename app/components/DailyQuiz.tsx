"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { DailyQuestion } from '../dailyQuizData';

interface DailyQuizProps {
    isDarkMode: boolean;
    todayQuestion: DailyQuestion | null;
    dailyQuizAnswer: string | null;
    dailyQuizResult: 'correct' | 'wrong' | null;
    onAnswer: (opt: string) => void;
}

export const DailyQuiz = ({
    isDarkMode,
    todayQuestion,
    dailyQuizAnswer,
    dailyQuizResult,
    onAnswer
}: DailyQuizProps) => {
    if (!todayQuestion) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto space-y-8"
        >
            <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-premium rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tighter italic">Daily JS Puzzle</h2>
                    <p className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                        Level — Advanced • 1 Attempt Only
                    </p>
                </div>
            </div>

            <div className="glass-card p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BookOpen className="w-24 h-24" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black leading-tight mb-10 relative z-10 text-foreground">
                    {todayQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                    {todayQuestion.options.map((opt, idx) => {
                        const isSelected = dailyQuizAnswer === opt;
                        const isAnswered = !!dailyQuizAnswer;
                        const isCorrect = opt === todayQuestion.answer;

                        let btnClass = "glass-card hover:bg-primary/5 border-transparent";
                        if (isAnswered) {
                            if (isCorrect) btnClass = "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                            else if (isSelected) btnClass = "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/50 text-rose-500 opacity-90 shadow-[0_0_20px_rgba(244,63,94,0.1)]";
                            else btnClass = "opacity-40 grayscale blur-[1px]";
                        }

                        return (
                            <motion.button
                                key={idx}
                                whileHover={!isAnswered ? { x: 8, backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' } : {}}
                                onClick={() => onAnswer(opt)}
                                disabled={isAnswered}
                                className={`w-full p-5 rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group text-foreground ${btnClass}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-colors ${isSelected
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-300'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {opt}
                                </div>
                                {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {dailyQuizAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl border-2 shadow-xl ${dailyQuizResult === 'correct'
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20'
                            : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20'
                            }`}
                    >
                        <div className="flex gap-4">
                            <div className={`p-2 rounded-xl shrink-0 ${dailyQuizResult === 'correct' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                                }`}>
                                {dailyQuizResult === 'correct'
                                    ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    : <XCircle className="w-5 h-5 text-rose-500" />
                                }
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 group-hover:opacity-100 transition-opacity">Deep Dive Explanation</p>
                                <p className="text-base font-medium leading-relaxed italic text-foreground">{todayQuestion.explanation}</p>
                                {dailyQuizResult === 'correct' ? (
                                    <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-2">+1 Day Streak Bonus 🔥</p>
                                ) : (
                                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest mt-2">Streak Lost 💔 (Restore in Daily Arena)</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
