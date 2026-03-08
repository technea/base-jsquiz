"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Zap, Flame, X, Bot, Sparkles } from 'lucide-react';
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
    // 🎙️ Voice Greeting removed in favor of Premium GM Intro to avoid browser blocks

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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 pb-8 px-4 sm:px-6 relative"
        >
            {/* ✨ Premium Background Animations */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        x: [0, -40, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]"
                />
            </div>

            <AnimatePresence>
                {dailyQuizAnswer && onClose && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={onClose}
                        className="absolute right-4 top-0 z-50 p-2 sm:p-3 rounded-full bg-background/80 backdrop-blur-sm border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-primary/50 transition-all shadow-xl"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="text-center space-y-2 sm:space-y-3 pt-8 sm:pt-4">
                {/* 🤖 ULTRA PREMIUM AI Mentor Avatar with Speech Bubble */}
                <motion.div
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    className="relative w-32 h-32 mx-auto mb-10"
                >
                    {/* Pulsing Outer Ring */}
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-primary rounded-full blur-3xl"
                    />

                    {/* Speech Bubble Refined */}
                    <motion.div
                        initial={{ opacity: 0, x: 30, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        transition={{ delay: 1, type: "spring", stiffness: 200 }}
                        className="absolute -top-16 -right-24 sm:-right-32 z-30 bg-white dark:bg-slate-800 px-5 py-3 rounded-[2rem] rounded-bl-none shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-2 border-primary/20"
                    >
                        <p className="text-xs sm:text-sm font-black text-primary uppercase tracking-tight leading-tight">
                            Good Morning! ☕<br />
                            <span className="text-[10px] opacity-70">Time for Quiz!</span>
                        </p>
                        <div className="absolute -bottom-3 left-0 w-4 h-4 bg-inherit border-l-2 border-b-2 border-primary/10 rotate-45" />
                    </motion.div>

                    {/* The Robot Itself */}
                    <motion.div
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-full h-full"
                    >
                        {/* Robot Head */}
                        <div className="w-full h-full bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-[2.5rem] p-6 shadow-2xl border-4 border-white/20 relative z-10 overflow-hidden">
                            <Bot className="w-full h-full text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />

                            {/* Animated Eyes */}
                            <div className="absolute top-[40%] left-0 w-full flex justify-center gap-4">
                                <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_8px_#67e8f9]" />
                                <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_8px_#67e8f9]" />
                            </div>

                            {/* Internal Glow */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                        </div>

                        {/* Floating Limb/Antenna */}
                        <motion.div
                            animate={{ rotate: [0, 15, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-4 -right-2 z-20"
                        >
                            <Sparkles className="w-8 h-8 text-amber-400 fill-amber-300 drop-shadow-lg" />
                        </motion.div>
                    </motion.div>
                </motion.div>

                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-1 sm:mb-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">24H Challenge</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none italic uppercase"
                >
                    Daily <span className="text-primary not-italic">Puzzle</span>
                </motion.h2>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    High Stakes • One Attempt
                </p>
            </div>

            <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative group"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-primary/10 rounded-2xl sm:rounded-[2.5rem] blur opacity-20"></div>
                <div className="relative glass-card p-6 sm:p-12 rounded-2xl sm:rounded-[2.5rem] bg-background/50 border-border/40 overflow-hidden shadow-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 0.03, x: 0 }}
                        className="absolute top-0 right-0 p-4 sm:p-8 select-none pointer-events-none"
                    >
                        <BookOpen className="w-32 h-32 sm:w-48 sm:h-48" />
                    </motion.div>

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
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={!isAnswered ? { y: -2, scale: 1.01, backgroundColor: isDarkMode ? 'rgba(0, 82, 255, 0.05)' : 'rgba(0, 82, 255, 0.03)' } : {}}
                                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                                    onClick={() => onAnswer(opt)}
                                    disabled={isAnswered}
                                    className={`w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group overflow-hidden ${btnStyle}`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-5 w-full">
                                        <motion.span
                                            animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                                            className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all ${isSelected
                                                ? 'bg-primary border-primary text-white shadow-lg'
                                                : 'border-border bg-background/50 text-muted-foreground'
                                                }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </motion.span>
                                        <span className="flex-1 break-words text-sm sm:text-lg leading-snug">
                                            {opt}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        {isAnswered && isCorrect && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                                            </motion.div>
                                        )}
                                        {isAnswered && isSelected && !isCorrect && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {dailyQuizAnswer && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] border-2 shadow-2xl relative overflow-hidden ${dailyQuizResult === 'correct'
                            ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10'
                            : 'bg-rose-500/5 border-rose-500/20 shadow-rose-500/10'
                            }`}
                    >
                        {/* Animated background highlights for result */}
                        <div className={`absolute inset-0 opacity-10 ${dailyQuizResult === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                        <div className="flex gap-4 sm:gap-6 relative z-10">
                            <motion.div
                                initial={{ rotate: -15, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center ${dailyQuizResult === 'correct' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                    }`}>
                                {dailyQuizResult === 'correct'
                                    ? <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                                    : <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500" />
                                }
                            </motion.div>
                            <div className="space-y-1 sm:space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Detailed Breakdown</p>
                                <p className="text-sm sm:text-lg font-bold leading-relaxed italic text-foreground">{todayQuestion.explanation}</p>
                                {dailyQuizResult === 'correct' ? (
                                    <div className="pt-1 sm:pt-2 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                        <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                                            <Flame className="w-3 h-3" />
                                        </motion.div>
                                        Streak Extended
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
